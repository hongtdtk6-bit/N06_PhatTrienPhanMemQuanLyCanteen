const API_BASE = "http://localhost:8080/api";

async function api(path, options={}) {
  const headers = {"Content-Type":"application/json", ...(options.headers||{})};
  const token = localStorage.getItem("canteenToken");
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(API_BASE + path, {...options, headers});
  const type = res.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await res.json().catch(()=>({})) : await res.text();
  if (!res.ok) throw new Error(data.message || data || "API error");
  return data;
}

function downloadReport(type){
  const token = localStorage.getItem("canteenToken");
  const a = document.createElement("a");
  a.href = API_BASE + "/reports/export?type=" + encodeURIComponent(type);
  a.download = "report." + type;
  // Export endpoint does not require authentication; token is kept in localStorage for API calls.
  document.body.appendChild(a); a.click(); a.remove();
}
