bash -c '
set -e

ADMIN_TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin_password" \
  -d "grant_type=password" | jq -r ".access_token")

# Get client ID
CLIENT_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/expo-app-realm/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r ".[] | select(.clientId==\"expo-app\") | .id")

echo "Deleting old client..."
curl -s -X DELETE "http://localhost:8080/admin/realms/expo-app-realm/clients/$CLIENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

sleep 2

echo "Creating new client with proper config..."
curl -s -X POST "http://localhost:8080/admin/realms/expo-app-realm/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"expo-app\",
    \"name\": \"Expo App\",
    \"enabled\": true,
    \"publicClient\": true,
    \"standardFlowEnabled\": true,
    \"directAccessGrantsEnabled\": true,
    \"implicitFlowEnabled\": false,
    \"serviceAccountsEnabled\": false,
    \"redirectUris\": [
      \"expo-app-presentation://\"
    ]
  }" > /dev/null

sleep 1

echo "✅ Client recreated!"

# Verify
NEW_CLIENT_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/expo-app-realm/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r ".[] | select(.clientId==\"expo-app\") | .id")

curl -s -X GET "http://localhost:8080/admin/realms/expo-app-realm/clients/$NEW_CLIENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq "{redirectUris, publicClient, standardFlowEnabled}"
'