#!/bin/bash

# API Test Script for Hills & Quills Backend

# --- Configuration ---
BASE_URL="http://localhost:3000/api"
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaXNfYWRtaW4iOnRydWUsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE3NDkxMTYxOTQsImV4cCI6MTc0OTIwMjU5NH0.99BexQR_S04UwIWSpAAH_NP10r5LKXaGssOyQqHA6Ww" # Replace with actual admin token
AUTHOR_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaXNfYWRtaW4iOmZhbHNlLCJlbWFpbCI6ImF1dGhvckBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IEF1dGhvciIsImlhdCI6MTc0OTExNjE2MywiZXhwIjoxNzQ5MjAyNTYzfQ.Fl2_XKC422L2G8QDE0jn8dvzsHyvC0bZwzsXZGHvWS4" # Replace with actual author token
AUTHOR_USER_ID=3 # Replace with the actual user ID of the author token holder

# Ensure jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found. Please install jq to run this script."
    echo "For example: sudo apt-get install jq or brew install jq"
    exit 1
fi

# --- Helper Functions ---
echo_header() {
    echo "
================================================================================
$1
================================================================================"
}

run_curl() {
    echo "
--- Testing: $1 ---"
    echo "Command: curl -s -X $2 "$3" $4 $5"
    RESPONSE=$(curl -s -w "\nHTTP_STATUS_CODE:%{http_code}" -X $2 "$3" $4 $5)
    HTTP_BODY=$(echo "$RESPONSE" | sed '$d') # Remove last line (status code)
    HTTP_STATUS=$(echo "$RESPONSE" | tail -n1 | sed 's/HTTP_STATUS_CODE://') # Get only status code

    echo "Status Code: $HTTP_STATUS"
    echo "Response Body:"
    echo "$HTTP_BODY" | jq '.' # Pretty print JSON if possible
    echo "--------------------------------------------------------------------------------"
    # Return body for potential use (e.g., extracting IDs)
    echo "$HTTP_BODY"
}

# --- Sample Data ---
ARTICLE_PAYLOAD_AUTHOR='{
  "title": "Test Article by Author from Script '"$(date +%s)"'",
  "description": "This is a test article created by an author via script.",
  "content": "Full content of the test article goes here. Lorem ipsum dolor sit amet.",
  "category": "Travel Guide",
  "region": "Nainital",
  "tags": ["testing", "script", "travel"]
}'

UPDATED_ARTICLE_PAYLOAD_AUTHOR='{
  "title": "UPDATED Test Article by Author from Script '"$(date +%s)"'",
  "description": "This article has been updated by the author via script.",
  "content": "Updated content. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "category": "Adventure Tourism",
  "region": "Rishikesh",
  "tags": ["updated", "adventure"]
}'

ARTICLE_PAYLOAD_ADMIN='{
  "title": "Admin Test Article '"$(date +%s)"'",
  "description": "Admin created this article for bulk testing.",
  "content": "Content for admin article.",
  "category": "Government Initiatives",
  "region": "Dehradun",
  "tags": ["admin", "bulk-test"]
}'

# --- Public Article Routes (No Auth) ---
echo_header "Testing Public Article Routes"

# 1. Get all public articles (approved)
run_curl "GET /public/articles (all approved)" "GET" "$BASE_URL/public/articles"
run_curl "GET /public/articles (paginated)" "GET" "$BASE_URL/public/articles?page=1&limit=2"
run_curl "GET /public/articles (by category)" "GET" "$BASE_URL/public/articles?category=Culture%20%26%20Heritage"
run_curl "GET /public/articles (by region)" "GET" "$BASE_URL/public/articles?region=Nainital"
run_curl "GET /public/articles (by tags)" "GET" "$BASE_URL/public/articles?tags=culture,heritage" # Assuming your data.sql has such articles

# 2. Get public article by ID (Assuming article ID 1 exists and is approved)
run_curl "GET /public/articles/1" "GET" "$BASE_URL/public/articles/1"

# 3. Get top news
run_curl "GET /public/articles/top-news" "GET" "$BASE_URL/public/articles/top-news?limit=3"

# 4. Search public articles
run_curl "GET /public/articles/search?query=Char%20Dham" "GET" "$BASE_URL/public/articles/search?query=Char%20Dham&limit=2"
run_curl "GET /public/articles/search?query=Rainfall&category=Weather" "GET" "$BASE_URL/public/articles/search?query=Rainfall&category=Weather"

# 5. Get public trending articles
run_curl "GET /public/articles/trending" "GET" "$BASE_URL/public/articles/trending?limit=3&timeframe=week"

# 6. Get articles by region
run_curl "GET /public/articles/region/Kumaon" "GET" "$BASE_URL/public/articles/region/Kumaon?limit=2"

# 7. Get articles by category
run_curl "GET /public/articles/category/Adventure%20Tourism" "GET" "$BASE_URL/public/articles/category/Adventure%20Tourism?limit=2"

# 8. Get Culture & Heritage articles (Specific endpoint or uses category filter)
# Assuming it uses the category filter as per public.controller.ts getCultureHeritageArticles
run_curl "GET /public/articles (Culture & Heritage)" "GET" "$BASE_URL/public/articles?category=Culture%20%26%20Heritage&limit=2"

# 9. Get From Districts articles (Specific endpoint or uses category filter)
# Assuming it uses the category filter as per public.controller.ts getFromDistrictsArticles
run_curl "GET /public/articles (From Districts)" "GET" "$BASE_URL/public/articles?category=From%20Districts&limit=2"

# 10. Get more stories (Pagination, often similar to getPublicArticles)
run_curl "GET /public/articles/more?page=2&limit=3" "GET" "$BASE_URL/public/articles/more?page=2&limit=3" # Path needs to match actual route

# 11. Get recent articles
run_curl "GET /public/articles/recent?limit=3" "GET" "$BASE_URL/public/articles/recent?limit=3"

# 12. Get public articles by tags (already covered in #1, but explicit call if different endpoint)
# Assuming /public/articles/tags?tags=... or similar if it's a distinct route from the general filter
run_curl "GET /public/articles (explicit by tags)" "GET" "$BASE_URL/public/articles?tags=testing,travel&limit=2"

# 13. Get featured articles
run_curl "GET /public/articles/featured?limit=3" "GET" "$BASE_URL/public/articles/featured?limit=3"


# --- Authenticated Article Routes (Author Token) ---
echo_header "Testing Authenticated Article Routes (Author: $AUTHOR_USER_ID)"

# 1. Create Article (Author)
CREATED_ARTICLE_RESPONSE_AUTHOR=$(run_curl "POST /articles (Author Create)" "POST" "$BASE_URL/articles" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $AUTHOR_TOKEN'" "-d '$ARTICLE_PAYLOAD_AUTHOR'")
CREATED_ARTICLE_ID_AUTHOR=$(echo "$CREATED_ARTICLE_RESPONSE_AUTHOR" | jq -r '.data.id // .id // null') # Adjust path based on your successResponse structure

echo "Captured Author Article ID: $CREATED_ARTICLE_ID_AUTHOR"

if [ "$CREATED_ARTICLE_ID_AUTHOR" == "null" ] || [ -z "$CREATED_ARTICLE_ID_AUTHOR" ]; then
    echo "Failed to create article as author or extract ID. Halting author-specific tests."
else
    # 2. Get All Articles (Author - should see own articles, including the new one)
    run_curl "GET /articles (Author - All Own)" "GET" "$BASE_URL/articles" "-H 'Authorization: Bearer $AUTHOR_TOKEN'"
    run_curl "GET /articles (Author - Filter by own ID)" "GET" "$BASE_URL/articles?author_id=$AUTHOR_USER_ID" "-H 'Authorization: Bearer $AUTHOR_TOKEN'"

    # 3. Search Articles (Author)
    run_curl "GET /articles/search?query=Test%20Article (Author)" "GET" "$BASE_URL/articles/search?query=Test%20Article" "-H 'Authorization: Bearer $AUTHOR_TOKEN'"

    # 4. Get Trending Articles (Author - context might differ from public)
    run_curl "GET /articles/trending (Author)" "GET" "$BASE_URL/articles/trending?limit=3" "-H 'Authorization: Bearer $AUTHOR_TOKEN'"

    # 5. Get Created Article by ID (Author)
    run_curl "GET /articles/$CREATED_ARTICLE_ID_AUTHOR (Author - Get Own)" "GET" "$BASE_URL/articles/$CREATED_ARTICLE_ID_AUTHOR" "-H 'Authorization: Bearer $AUTHOR_TOKEN'"

    # 6. Update Created Article (Author)
    run_curl "PUT /articles/$CREATED_ARTICLE_ID_AUTHOR (Author - Update Own)" "PUT" "$BASE_URL/articles/$CREATED_ARTICLE_ID_AUTHOR" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $AUTHOR_TOKEN'" "-d '$UPDATED_ARTICLE_PAYLOAD_AUTHOR'"

    # 7. Submit Created Article for Approval (Author)
    run_curl "POST /articles/$CREATED_ARTICLE_ID_AUTHOR/submit (Author - Submit Own)" "POST" "$BASE_URL/articles/$CREATED_ARTICLE_ID_AUTHOR/submit" "-H 'Authorization: Bearer $AUTHOR_TOKEN'"
fi

# --- Admin Article Routes (Admin Token) ---
echo_header "Testing Admin Article Routes"

# Create a few articles as Admin for bulk operations if needed
CREATED_ADMIN_ARTICLE_ID_1=$(echo "$(run_curl "POST /articles (Admin Create for Bulk 1)" "POST" "$BASE_URL/articles" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN'" "-d '$ARTICLE_PAYLOAD_ADMIN'")" | jq -r '.data.id // .id // null')
# Submit it for approval by admin itself (or an author would do this)
if [ "$CREATED_ADMIN_ARTICLE_ID_1" != "null" ] && [ -n "$CREATED_ADMIN_ARTICLE_ID_1" ]; then
    run_curl "POST /articles/$CREATED_ADMIN_ARTICLE_ID_1/submit (Admin Submit Own for Test)" "POST" "$BASE_URL/articles/$CREATED_ADMIN_ARTICLE_ID_1/submit" "-H 'Authorization: Bearer $ADMIN_TOKEN'"
fi

CREATED_ADMIN_ARTICLE_ID_2=$(echo "$(run_curl "POST /articles (Admin Create for Bulk 2)" "POST" "$BASE_URL/articles" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN'" "-d '$ARTICLE_PAYLOAD_ADMIN'")" | jq -r '.data.id // .id // null')
if [ "$CREATED_ADMIN_ARTICLE_ID_2" != "null" ] && [ -n "$CREATED_ADMIN_ARTICLE_ID_2" ]; then
    run_curl "POST /articles/$CREATED_ADMIN_ARTICLE_ID_2/submit (Admin Submit Own for Test)" "POST" "$BASE_URL/articles/$CREATED_ADMIN_ARTICLE_ID_2/submit" "-H 'Authorization: Bearer $ADMIN_TOKEN'"
fi

# 1. Get All Articles (Admin - should see all)
run_curl "GET /articles (Admin - All)" "GET" "$BASE_URL/articles?limit=50" "-H 'Authorization: Bearer $ADMIN_TOKEN'"

if [ "$CREATED_ARTICLE_ID_AUTHOR" != "null" ] && [ -n "$CREATED_ARTICLE_ID_AUTHOR" ]; then
    # 2. Approve Submitted Article (Admin - Approving author's article)
    run_curl "POST /articles/admin/$CREATED_ARTICLE_ID_AUTHOR/approve (Admin Approve Author's)" "POST" "$BASE_URL/articles/admin/$CREATED_ARTICLE_ID_AUTHOR/approve" "-H 'Authorization: Bearer $ADMIN_TOKEN'"

    # Simulate multiple views for the approved article to make it a trending candidate
    echo "--- Simulating views for article ID $CREATED_ARTICLE_ID_AUTHOR ---"
    for i in {1..20}; do # Simulate 20 views
        # We call the public GET endpoint which should increment views
        # Suppress output for these view-incrementing calls to keep logs cleaner
        curl -s -X GET "$BASE_URL/public/articles/$CREATED_ARTICLE_ID_AUTHOR" > /dev/null 
        echo -n "." # Progress indicator
    done
    echo "\nViews simulated for article ID $CREATED_ARTICLE_ID_AUTHOR."
    echo "--------------------------------------------------------------------------------"

    # 4. Mark Article as Top News (Admin - Marking author's approved article)
    run_curl "POST /articles/admin/$CREATED_ARTICLE_ID_AUTHOR/top (Admin Mark Top News)" "POST" "$BASE_URL/articles/admin/$CREATED_ARTICLE_ID_AUTHOR/top" "-H 'Authorization: Bearer $ADMIN_TOKEN'"

    # 5. Unmark Article as Top News (Admin)
    run_curl "DELETE /articles/admin/$CREATED_ARTICLE_ID_AUTHOR/top (Admin Unmark Top News)" "DELETE" "$BASE_URL/articles/admin/$CREATED_ARTICLE_ID_AUTHOR/top" "-H 'Authorization: Bearer $ADMIN_TOKEN'"

    # 3. Reject an Article (Admin - Let's try to reject one of the admin-created ones if it's pending)
    # For this to work, CREATED_ADMIN_ARTICLE_ID_1 must be in 'pending' state.
    if [ "$CREATED_ADMIN_ARTICLE_ID_1" != "null" ] && [ -n "$CREATED_ADMIN_ARTICLE_ID_1" ]; then
        # First, ensure it's not 'rejected', if it was, this won't work. Let's assume it was approved.
        # To reject, it ideally should be 'pending'. The current flow approves them.
        # For a clean test, one might need to create a new set of 'pending' articles here.
        # Or, if your system allows rejecting 'approved' articles to 'rejected' status:
        echo "Note: Bulk reject test assumes articles can be moved to 'rejected' state."
        run_curl "POST /articles/admin/$CREATED_ADMIN_ARTICLE_ID_1/reject (Admin Reject)" "POST" "$BASE_URL/articles/admin/$CREATED_ADMIN_ARTICLE_ID_1/reject" "-H 'Authorization: Bearer $ADMIN_TOKEN'"
    fi

    # 6. Delete Article (Admin - Deleting author's article)
    run_curl "DELETE /articles/$CREATED_ARTICLE_ID_AUTHOR (Admin Delete Author's)" "DELETE" "$BASE_URL/articles/$CREATED_ARTICLE_ID_AUTHOR" "-H 'Authorization: Bearer $ADMIN_TOKEN'"
else
    echo "Skipping admin operations on author's article as it was not created successfully."
fi

# --- Admin Bulk Operations (Admin Token) ---
echo_header "Testing Admin Bulk Operations"

# Prepare IDs for bulk operations - using admin created articles
# Ensure these articles are in appropriate states (e.g., 'pending' for bulk approve/reject)
BULK_IDS_LIST=()
if [ "$CREATED_ADMIN_ARTICLE_ID_1" != "null" ] && [ -n "$CREATED_ADMIN_ARTICLE_ID_1" ]; then BULK_IDS_LIST+=($CREATED_ADMIN_ARTICLE_ID_1); fi
if [ "$CREATED_ADMIN_ARTICLE_ID_2" != "null" ] && [ -n "$CREATED_ADMIN_ARTICLE_ID_2" ]; then BULK_IDS_LIST+=($CREATED_ADMIN_ARTICLE_ID_2); fi

# Convert bash array to JSON array string for payload
BULK_IDS_JSON=$(printf '%s\n' "${BULK_IDS_LIST[@]}" | jq -R . | jq -s .)
echo "Using Article IDs for Bulk Operations: $BULK_IDS_JSON"

if [ ${#BULK_IDS_LIST[@]} -gt 0 ]; then
    # 1. Bulk Approve Articles (IDs should be for 'pending' articles)
    # The script submitted them, so they should be pending if not rejected above.
    run_curl "POST /articles/admin/bulk/approve (Admin)" "POST" "$BASE_URL/articles/admin/bulk/approve" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN'" "-d '{"ids": $BULK_IDS_JSON}'"

    # 2. Bulk Mark as Top News (IDs should be for 'approved' articles)
    run_curl "POST /articles/admin/bulk/top (Admin)" "POST" "$BASE_URL/articles/admin/bulk/top" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN'" "-d '{"ids": $BULK_IDS_JSON}'"

    # 3. Bulk Unmark as Top News
    run_curl "DELETE /articles/admin/bulk/top (Admin)" "DELETE" "$BASE_URL/articles/admin/bulk/top" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN'" "-d '{"ids": $BULK_IDS_JSON}'"
    
    # 4. Bulk Reject Articles (IDs should be for 'pending' or 'approved' articles that can be rejected)
    # Re-submit one to pending if it was approved, for testing reject
    if [ "$CREATED_ADMIN_ARTICLE_ID_1" != "null" ] && [ -n "$CREATED_ADMIN_ARTICLE_ID_1" ]; then
        # First, ensure it's not 'rejected', if it was, this won't work. Let's assume it was approved.
        # To reject, it ideally should be 'pending'. The current flow approves them.
        # For a clean test, one might need to create a new set of 'pending' articles here.
        # Or, if your system allows rejecting 'approved' articles to 'rejected' status:
        echo "Note: Bulk reject test assumes articles can be moved to 'rejected' state."
        run_curl "POST /articles/admin/bulk/reject (Admin)" "POST" "$BASE_URL/articles/admin/bulk/reject" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN'" "-d '{"ids": [$CREATED_ADMIN_ARTICLE_ID_1]}'") # Test with one ID
    fi

    # 5. Bulk Delete Articles
    run_curl "POST /articles/admin/bulk/delete (Admin)" "POST" "$BASE_URL/articles/admin/bulk/delete" "-H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN'" "-d '{"ids": $BULK_IDS_JSON}'"
else
    echo "Skipping bulk operations as no admin articles were created successfully."
fi

echo_header "API Test Script Finished"


#Routes to Test:

GET /articles
Request: GET http://localhost:YOUR_PORT/api/public/articles
Expected: All 3 articles, likely sorted by publish_date DESC (Article 3, then Article 2, then Article 1).
Test with params:
?page=1&limit=2: Should show 2 articles (Article 3, Article 2).
?sortBy=views_count&sortOrder=ASC: Should show Article 1 & 2 (100 views), then Article 3 (800 views).
GET /articles/recent
Request: GET http://localhost:YOUR_PORT/api/public/articles/recent
Expected: Articles sorted by publish_date DESC. By default, getRecentArticles might have a small limit (e.g., 5 or 10). All 3 articles should be returned in order: Article 3, Article 2, Article 1.
Test with params: ?limit=1: Should show Article 3.
GET /articles/search
Request: GET http://localhost:YOUR_PORT/api/public/articles/search
Query Parameters to Test:
?q=Region: Should return Article 2 ("Heavy Rainfall Alert for Garhwal Region").
?q=Test: Should return Article 3 ("Updated Test Article").
?q=culture: Should return Article 1 (tags include "culture").
?tags=weather: Should return Article 2.
?category=Weather: Should return Article 2.
?region=Garhwal: Should return Article 2.
?q=2025&sortBy=views_count&sortOrder=DESC: Should return Article 3, then Article 1, then Article 2.
GET /articles/trending
Request: GET http://localhost:YOUR_PORT/api/public/articles/trending
Expected: This depends on your trending algorithm (views, publish date, timeframe).
Article 3 has high views (800) and is recent.
Article 1 & 2 have fewer views but are also recent.
Likely order: Article 3, then a tie-break between Article 1 and 2.
Test with params: ?limit=1: Should likely show Article 3. ?timeframe=7d (assuming current date is around 2025-06-06).
GET /articles/top
Request: GET http://localhost:YOUR_PORT/api/public/articles/top
Expected: Articles where is_top_news is TRUE, sorted by publish_date DESC.
Article 3 (is_top_news=1, publish: 2025-06-05)
Article 1 (is_top_news=1, publish: 2025-05-22)
Test with params: ?limit=1: Should show Article 3.
GET /articles/more-stories
Request: GET http://localhost:YOUR_PORT/api/public/articles/more-stories
Expected: Similar to /articles, usually used for pagination. All 3 articles.
Test with params: ?page=2&limit=2&excludeIds=3: Assuming default sort, if Article 3 was on page 1, this would try to get the next 2, excluding ID 3. So, Article 2 and Article 1.
GET /articles/by-tags
Request: GET http://localhost:YOUR_PORT/api/public/articles/by-tags
Query Parameters to Test:
?tags=culture: Should return Article 1.
?tags=weather: Should return Article 2.
?tags=api,postman: Should return Article 3 (assuming AND logic for multiple tags).
?tags=nonexistenttag: Should return an empty array.
GET /articles/featured
Request: GET http://localhost:YOUR_PORT/api/public/articles/featured
Expected: Depends on the logic (mix of top news and high views).
Likely Article 3 (top news, high views), then Article 1 (top news). Article 2 is not top news.
Test with params: ?limit=1: Should likely show Article 3.
GET /articles/culture-heritage
Request: GET http://localhost:YOUR_PORT/api/public/articles/culture-heritage
Expected: Articles with category = "Culture & Heritage".
Should return Article 1.
GET /articles/category/:category
Requests:
GET http://localhost:YOUR_PORT/api/public/articles/category/Weather: Should return Article 2.
GET http://localhost:YOUR_PORT/api/public/articles/category/Travel%20Guide: Should return Article 3. (URL encode space to %20)
GET http://localhost:YOUR_PORT/api/public/articles/category/NonExistent: Should return empty array.
GET /articles/region/:region
Requests:
GET http://localhost:YOUR_PORT/api/public/articles/region/Garhwal: Should return Article 2.
GET http://localhost:YOUR_PORT/api/public/articles/region/Uttarakhand: Should return Article 1.
GET http://localhost:YOUR_PORT/api/public/articles/region/Dehradun: Behavior depends on validation. If "Dehradun" is not a valid region enum, this might return an error or empty. If your system allows any string or if "Dehradun" is somehow mapped, it might return Article 3.
GET http://localhost:YOUR_PORT/api/public/articles/region/Kumaon: Should return empty array (no articles in Kumaon region with this data).
GET /articles/from-districts
Request: GET http://localhost:YOUR_PORT/api/public/articles/from-districts
Expected: All articles, as this route usually fetches articles that could have a district or all if no specific district is given. The controller logic for getFromDistrictsArticles without a :district param needs to be checked. It might fetch all articles or articles where district is not null.
Assuming it fetches all if no district param: Article 3, 2, 1.
GET /articles/from-districts/:district
Request: GET http://localhost:YOUR_PORT/api/public/articles/from-districts/Dehradun
Expected: Article 3 (assuming "Dehradun" is its district).
Request: GET http://localhost:YOUR_PORT/api/public/articles/from-districts/Garhwal
Expected: This depends on whether "Garhwal" is treated as a district in your data. Article 2 has region: "Garhwal". If its district column is also "Garhwal" or if the query checks region too, it might return Article 2. If district is different, empty array.
GET /articles/:id
Requests:
GET http://localhost:YOUR_PORT/api/public/articles/1: Should return Article 1. View count should increment.
GET http://localhost:YOUR_PORT/api/public/articles/2: Should return Article 2. View count should increment.
GET http://localhost:YOUR_PORT/api/public/articles/3: Should return Article 3. View count should increment.
GET http://localhost:YOUR_PORT/api/public/articles/999: Should return a 404 Not Found error. #