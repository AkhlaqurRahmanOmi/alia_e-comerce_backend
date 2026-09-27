#!/usr/bin/env bash
# SessionStart hook: inject graphify orientation so a new session queries the
# knowledge graph instead of reading/grepping the codebase from scratch.
# Silent no-op when no graph exists. Never fails the session.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
GRAPH="$ROOT/graphify-out/graph.json"
CACHE="$ROOT/graphify-out/.orientation.md"

[ -f "$GRAPH" ] || exit 0

PY="$ROOT/graphify-out/.graphify_python"
PYBIN="python3"
[ -f "$PY" ] && PYBIN="$(cat "$PY")"

# Regenerate the cached summary only when the graph is newer than the cache.
if [ ! -f "$CACHE" ] || [ "$GRAPH" -nt "$CACHE" ]; then
  "$PYBIN" - "$GRAPH" "$CACHE" <<'PYEOF' 2>/dev/null || exit 0
import json, sys, collections
from pathlib import Path

graph_path, cache_path = Path(sys.argv[1]), Path(sys.argv[2])
g = json.loads(graph_path.read_text(encoding="utf-8"))
nodes = g.get("nodes", [])
edges = g.get("edges", g.get("links", []))

# Generated Prisma types dominate degree and community size but say nothing about
# the application's own design. Keep them in the graph, exclude from orientation.
GENERATED = ("src/generated/",)
def is_generated(n):
    sf = (n.get("source_file") or "").replace("\\", "/")
    return any(sf.startswith(p) for p in GENERATED)

authored = {n.get("id") for n in nodes if not is_generated(n)}

deg = collections.Counter()
for e in edges:
    for k in ("source", "target"):
        v = e.get(k)
        if isinstance(v, dict):
            v = v.get("id")
        if v:
            deg[v] += 1

label = {n.get("id"): (n.get("label") or n.get("id")) for n in nodes}

# `graphify update` re-clusters and replaces curated community names with the
# busiest node's name ("auth.module.ts"). Derive area names from source paths
# instead: deterministic, free, and stable across every rebuild.
MODULE = {
    "auth": "Authentication", "user": "User Accounts", "catalog": "Product Catalog",
    "cart": "Shopping Cart", "orders": "Order Processing", "payments": "Payments",
    "shipping": "Shipping", "inventory": "Inventory", "coupons": "Coupons",
    "bundles": "Product Bundles", "reviews": "Product Reviews", "blog": "Blog",
    "notifications": "Notifications", "cms": "CMS Homepage", "rbac": "Roles & Permissions",
    "reports": "Reporting", "country": "Wine Origin Countries", "bookings": "Bookings",
    "shared": "Shared Infrastructure", "tasks": "Scheduled Tasks", "config": "App Config",
    "constants": "App Constants", "modules": "Module Composition", "generated": "Generated Prisma",
}
KIND = [
    ("/dtos/", "DTOs"), ("/repositories/", "Repositories"), ("/providers/", "Providers"),
    ("/guards/", "Guards"), ("/gateways/", "Gateways"), ("/enums/", "Enums"),
    ("/interfaces/", "Interfaces"), ("/types/", "Types"), ("/decorators/", "Decorators"),
    ("/interceptors/", "Interceptors"), ("/filters/", "Filters"), ("/strategies/", "Strategies"),
    ("/templates/", "Templates"), ("/seeds/", "Seed Data"),
]

def area_of(n):
    p = (n.get("source_file") or "").replace("\\", "/")
    if not p:
        return None
    if p.startswith("prisma/"):
        return "Database Schema & Seeds"
    if p.startswith(".claude/"):
        return "Claude Tooling & Skills"
    if not p.startswith("src/"):
        return "Build, Deploy & Docs"
    parts = p.split("/")
    if len(parts) < 2:
        return "App Bootstrap"
    mod = MODULE.get(parts[1], parts[1].replace("-", " ").title())
    for frag, kind in KIND:
        if frag in p:
            return f"{mod} {kind}"
    stem = parts[-1]
    for suffix, kind in (("controller.ts", "Controllers"), ("service.ts", "Services"),
                         ("module.ts", "Module Wiring"), ("task.ts", "Scheduled Tasks")):
        if stem.endswith(suffix):
            return f"{mod} {kind}"
    return mod

comm = collections.Counter()
for n in nodes:
    if is_generated(n):
        continue
    a = area_of(n)
    if a:
        comm[a] += 1

lines = []
lines.append(f"Knowledge graph available: {len(nodes):,} nodes, {len(edges):,} edges "
             f"(graphify-out/graph.json).")
lines.append(f"Hubs and areas below cover the {len(authored):,} hand-authored nodes; "
             f"generated Prisma types are in the graph but omitted here.")
lines.append("")
lines.append("Architectural hubs (most connected):")
shown = 0
for nid, d in deg.most_common():
    if nid not in authored:
        continue
    lines.append(f"  - {label.get(nid, nid)} ({d} edges)")
    shown += 1
    if shown >= 12:
        break
lines.append("")
lines.append("Main areas of the codebase:")
for name, c in comm.most_common(20):
    lines.append(f"  - {name} ({c} nodes)")
cache_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
PYEOF
fi

[ -f "$CACHE" ] || exit 0

# Staleness: is any tracked source file newer than the graph?
STALE=""
if command -v find >/dev/null 2>&1; then
  # Exclude src/generated: `prisma generate` rewrites it on every build, which
  # would pin the warning on permanently and train the reader to ignore it.
  NEWER=$(find "$ROOT/src" "$ROOT/prisma" -type f \
            -not -path "$ROOT/src/generated/*" \
            \( -name '*.ts' -o -name '*.prisma' -o -name '*.sql' \) \
            -newer "$GRAPH" -print -quit 2>/dev/null)
  [ -n "$NEWER" ] && STALE="STALE: source files have changed since the graph was built. Run \`graphify update .\` before trusting it for fine detail."
fi

CONTEXT=$(
  echo "## Codebase orientation (graphify)"
  echo
  cat "$CACHE"
  [ -n "$STALE" ] && { echo; echo "$STALE"; }
  echo
  echo "QUERY THE GRAPH FIRST. To answer a question about this codebase, architecture, or"
  echo "how parts relate, run one of these BEFORE reading files or grepping:"
  echo '  graphify query "<question>"       # scoped subgraph for a question'
  echo '  graphify path "<A>" "<B>"         # how two things connect'
  echo '  graphify explain "<symbol>"       # a node and its neighbors'
  echo '  graphify affected "<symbol>"      # what breaks if you change it'
  echo "Then read only the specific files the graph points you at. This is ~8x cheaper"
  echo "in tokens than scanning the codebase. Read/grep freely once oriented, or when"
  echo "editing or debugging specific lines. If the graph and the code disagree, the"
  echo "code wins - say so and run \`graphify update .\`."
)

# Emit as an explicit SessionStart context envelope; suppressed from the
# transcript view so it costs the user no screen space.
if command -v jq >/dev/null 2>&1; then
  printf '%s' "$CONTEXT" | jq -Rs '{
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: .
    }
  }' 2>/dev/null || printf '%s\n' "$CONTEXT"
else
  printf '%s\n' "$CONTEXT"
fi

exit 0
