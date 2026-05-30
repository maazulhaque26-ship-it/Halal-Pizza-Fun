#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/verify-vercel-token.sh
#
# Local diagnostic script to verify your Vercel token, org ID, and project ID
# BEFORE pushing to GitHub Actions.
#
# Usage:
#   chmod +x scripts/verify-vercel-token.sh
#   VERCEL_TOKEN=your_token_here ./scripts/verify-vercel-token.sh
#
# Or source your .env.local first:
#   export $(grep -v '^#' .env.local | xargs)   # Only if .env.local has VERCEL_TOKEN
#   ./scripts/verify-vercel-token.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

echo ""
echo -e "${BLUE}══════════════════════════════════════════════${NC}"
echo -e "${BLUE}   HPF — Vercel Credential Diagnostic Tool   ${NC}"
echo -e "${BLUE}══════════════════════════════════════════════${NC}"
echo ""

# ── 1. Check VERCEL_TOKEN ──────────────────────────────────────────────────
if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo -e "${RED}❌ VERCEL_TOKEN is not set in your environment.${NC}"
  echo "   Run: export VERCEL_TOKEN=your_token_here"
  exit 1
fi

TOKEN_LEN=${#VERCEL_TOKEN}
TOKEN_PREVIEW="${VERCEL_TOKEN:0:6}...${VERCEL_TOKEN: -4}"
echo -e "${YELLOW}▶ Token preview:${NC} $TOKEN_PREVIEW  (length: $TOKEN_LEN)"

# Sanity: Vercel tokens are typically 24 chars. Warn if suspiciously short/long.
if [[ $TOKEN_LEN -lt 20 ]]; then
  echo -e "${RED}⚠  Token length ($TOKEN_LEN) is suspiciously short. Possible copy-paste issue.${NC}"
fi

# Check for whitespace (common copy-paste mistake)
if [[ "$VERCEL_TOKEN" != "${VERCEL_TOKEN//[[:space:]]/}" ]]; then
  echo -e "${RED}❌ VERCEL_TOKEN contains whitespace characters. Strip them.${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}── Step 1: Validate token via Vercel REST API ──${NC}"

HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" \
  --header "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/user")

if [[ "$HTTP_STATUS" == "200" ]]; then
  USER_INFO=$(curl --silent \
    --header "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v2/user")
  USER_EMAIL=$(echo "$USER_INFO" | grep -o '"email":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✅ Token is VALID.${NC} Authenticated as: $USER_EMAIL"
elif [[ "$HTTP_STATUS" == "401" ]]; then
  echo -e "${RED}❌ Token is INVALID or EXPIRED (HTTP 401).${NC}"
  echo "   → Go to https://vercel.com/account/tokens"
  echo "   → Delete old token, generate a new one."
  echo "   → Update VERCEL_TOKEN in GitHub → Settings → Secrets."
  exit 1
elif [[ "$HTTP_STATUS" == "403" ]]; then
  echo -e "${RED}❌ Token exists but has INSUFFICIENT PERMISSIONS (HTTP 403).${NC}"
  echo "   → Create a token with full scope."
  exit 1
else
  echo -e "${RED}❌ Unexpected response: HTTP $HTTP_STATUS${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}── Step 2: List your Vercel teams/orgs ──${NC}"

TEAMS=$(curl --silent \
  --header "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/teams")

echo "$TEAMS" | grep -o '"id":"[^"]*"\|"slug":"[^"]*"\|"name":"[^"]*"' \
  | paste - - - || echo "(No teams — you are on a personal account)"

echo ""
echo -e "${BLUE}── Step 3: Verify VERCEL_ORG_ID ──${NC}"

if [[ -z "${VERCEL_ORG_ID:-}" ]]; then
  echo -e "${YELLOW}⚠  VERCEL_ORG_ID not set. For a personal account, use your user ID.${NC}"
  echo "   Run: vercel whoami"
else
  echo "   VERCEL_ORG_ID = $VERCEL_ORG_ID"
  echo -e "${GREEN}✅ Present.${NC} Cross-check the value above against Vercel → Settings → General."
fi

echo ""
echo -e "${BLUE}── Step 4: Verify VERCEL_PROJECT_ID ──${NC}"

if [[ -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo -e "${YELLOW}⚠  VERCEL_PROJECT_ID not set.${NC}"
  echo "   Run: vercel project ls --token=\$VERCEL_TOKEN"
else
  echo "   VERCEL_PROJECT_ID = $VERCEL_PROJECT_ID"
  echo -e "${GREEN}✅ Present.${NC}"
fi

echo ""
echo -e "${BLUE}── Step 5: Verify project exists in Vercel ──${NC}"

if [[ -n "${VERCEL_PROJECT_ID:-}" && -n "${VERCEL_ORG_ID:-}" ]]; then
  PROJECT_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" \
    --header "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_ORG_ID}")

  if [[ "$PROJECT_STATUS" == "200" ]]; then
    echo -e "${GREEN}✅ Project found and accessible.${NC}"
  elif [[ "$PROJECT_STATUS" == "404" ]]; then
    echo -e "${RED}❌ Project NOT FOUND (HTTP 404).${NC}"
    echo "   VERCEL_PROJECT_ID may be wrong or belongs to a different team."
  else
    echo -e "${YELLOW}⚠  HTTP $PROJECT_STATUS — check Vercel dashboard.${NC}"
  fi
fi

echo ""
echo -e "${BLUE}── Step 6: CLI version ──${NC}"
vercel --version 2>/dev/null || echo "(vercel CLI not installed globally)"

echo ""
echo -e "${BLUE}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Diagnostic complete.${NC}"
echo -e "${BLUE}══════════════════════════════════════════════${NC}"
echo ""