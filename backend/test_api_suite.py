import urllib.request
import json

base_url = "http://localhost:8000"

def get(path):
    req = urllib.request.Request(f"{base_url}{path}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def post(path, data):
    req = urllib.request.Request(
        f"{base_url}{path}",
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def patch(path, data):
    req = urllib.request.Request(
        f"{base_url}{path}",
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def delete(path):
    req = urllib.request.Request(f"{base_url}{path}", method="DELETE")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

print("Testing Health Check...")
health = get("/health")
print("Health:", health)

print("Testing Metrics...")
metrics = get("/metrics")
print(f"Metrics: Total={metrics['total']}, Pipeline=${metrics['totalPipelineValue']:,}")

print("Testing Lead Creation...")
lead_payload = {
    "source_id": "REV-TEST-999",
    "customer": "Jessica Alba",
    "company": "Honest Cloud Tech",
    "contact": "jessica@honestcloud.com",
    "owner": "Marcus Vance",
    "deal_value": 72000.0,
    "priority": "High",
    "stage": "Proposal",
    "routing": "Enterprise Sales",
    "summary": "Full cloud security audit and expansion.",
    "notes": "Verified customer interest."
}
created = post("/conversations", lead_payload)
print(f"Created Lead: ID={created['id']}, Company={created['company']}, Value=${created['deal_value']}")

print("Testing Partial Update (PATCH)...")
patched = patch(f"/conversations/{created['id']}", {"deal_value": 80000.0, "notes": "Approved by CFO"})
print(f"Patched Lead: New Value=${patched['deal_value']}, Notes='{patched['notes']}', Override={patched['manual_override']}")

print("Testing CSV Export...")
csv_exp = get("/export/csv")
print(f"CSV Filename={csv_exp['filename']}, Rows exported in content: {csv_exp['content'].count(chr(10))} lines")

print("Testing JSON Export...")
json_exp = get("/export/json")
print(f"JSON Export Count: {len(json_exp)} items")

print("Testing Deletion...")
del_res = delete(f"/conversations/{created['id']}")
print("Delete Result:", del_res)

print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
