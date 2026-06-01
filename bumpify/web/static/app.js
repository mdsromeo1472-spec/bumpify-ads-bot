const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor("#ffffff"); tg.setBackgroundColor("#ffffff"); }

const userId = tg?.initDataUnsafe?.user?.id
  || parseInt(new URLSearchParams(location.search).get("user_id") || "0", 10)
  || 0;

const COUNTRIES = [
  ["Afghanistan","AF","93"],["Albania","AL","355"],["Algeria","DZ","213"],["American Samoa","AS","1684"],
  ["Andorra","AD","376"],["Angola","AO","244"],["Anguilla","AI","1264"],["Antigua and Barbuda","AG","1268"],
  ["Argentina","AR","54"],["Armenia","AM","374"],["Aruba","AW","297"],["Australia","AU","61"],
  ["Austria","AT","43"],["Azerbaijan","AZ","994"],["Bahamas","BS","1242"],["Bahrain","BH","973"],
  ["Bangladesh","BD","880"],["Barbados","BB","1246"],["Belarus","BY","375"],["Belgium","BE","32"],
  ["Belize","BZ","501"],["Benin","BJ","229"],["Bermuda","BM","1441"],["Bhutan","BT","975"],
  ["Bolivia","BO","591"],["Bosnia and Herzegovina","BA","387"],["Botswana","BW","267"],["Brazil","BR","55"],
  ["British Indian Ocean Territory","IO","246"],["Brunei","BN","673"],["Bulgaria","BG","359"],
  ["Burkina Faso","BF","226"],["Burundi","BI","257"],["Cambodia","KH","855"],["Cameroon","CM","237"],
  ["Canada","CA","1"],["Cape Verde","CV","238"],["Cayman Islands","KY","1345"],
  ["Central African Republic","CF","236"],["Chad","TD","235"],["Chile","CL","56"],["China","CN","86"],
  ["Christmas Island","CX","61"],["Colombia","CO","57"],["Comoros","KM","269"],
  ["Congo (Democratic Republic)","CD","243"],["Congo (Republic)","CG","242"],["Cook Islands","CK","682"],
  ["Costa Rica","CR","506"],["Croatia","HR","385"],["Cuba","CU","53"],["Curacao","CW","599"],
  ["Cyprus","CY","357"],["Czech Republic","CZ","420"],["Denmark","DK","45"],["Djibouti","DJ","253"],
  ["Dominica","DM","1767"],["Dominican Republic","DO","1809"],["East Timor","TL","670"],
  ["Ecuador","EC","593"],["Egypt","EG","20"],["El Salvador","SV","503"],
  ["Equatorial Guinea","GQ","240"],["Eritrea","ER","291"],["Estonia","EE","372"],
  ["Eswatini","SZ","268"],["Ethiopia","ET","251"],["Falkland Islands","FK","500"],
  ["Faroe Islands","FO","298"],["Fiji","FJ","679"],["Finland","FI","358"],["France","FR","33"],
  ["French Guiana","GF","594"],["French Polynesia","PF","689"],["Gabon","GA","241"],
  ["Gambia","GM","220"],["Georgia","GE","995"],["Germany","DE","49"],["Ghana","GH","233"],
  ["Gibraltar","GI","350"],["Greece","GR","30"],["Greenland","GL","299"],["Grenada","GD","1473"],
  ["Guadeloupe","GP","590"],["Guam","GU","1671"],["Guatemala","GT","502"],["Guinea","GN","224"],
  ["Guinea-Bissau","GW","245"],["Guyana","GY","592"],["Haiti","HT","509"],["Honduras","HN","504"],
  ["Hong Kong","HK","852"],["Hungary","HU","36"],["Iceland","IS","354"],["India","IN","91"],
  ["Indonesia","ID","62"],["Iran","IR","98"],["Iraq","IQ","964"],["Ireland","IE","353"],
  ["Isle of Man","IM","44"],["Israel","IL","972"],["Italy","IT","39"],["Ivory Coast","CI","225"],
  ["Jamaica","JM","1876"],["Japan","JP","81"],["Jordan","JO","962"],["Kazakhstan","KZ","7"],
  ["Kenya","KE","254"],["Kiribati","KI","686"],["Kosovo","XK","383"],["Kuwait","KW","965"],
  ["Kyrgyzstan","KG","996"],["Laos","LA","856"],["Latvia","LV","371"],["Lebanon","LB","961"],
  ["Lesotho","LS","266"],["Liberia","LR","231"],["Libya","LY","218"],["Liechtenstein","LI","423"],
  ["Lithuania","LT","370"],["Luxembourg","LU","352"],["Macau","MO","853"],
  ["Madagascar","MG","261"],["Malawi","MW","265"],["Malaysia","MY","60"],["Maldives","MV","960"],
  ["Mali","ML","223"],["Malta","MT","356"],["Marshall Islands","MH","692"],["Martinique","MQ","596"],
  ["Mauritania","MR","222"],["Mauritius","MU","230"],["Mayotte","YT","262"],["Mexico","MX","52"],
  ["Micronesia","FM","691"],["Moldova","MD","373"],["Monaco","MC","377"],["Mongolia","MN","976"],
  ["Montenegro","ME","382"],["Montserrat","MS","1664"],["Morocco","MA","212"],["Mozambique","MZ","258"],
  ["Myanmar","MM","95"],["Namibia","NA","264"],["Nauru","NR","674"],["Nepal","NP","977"],
  ["Netherlands","NL","31"],["New Caledonia","NC","687"],["New Zealand","NZ","64"],
  ["Nicaragua","NI","505"],["Niger","NE","227"],["Nigeria","NG","234"],["Niue","NU","683"],
  ["North Korea","KP","850"],["North Macedonia","MK","389"],["Northern Mariana Islands","MP","1670"],
  ["Norway","NO","47"],["Oman","OM","968"],["Pakistan","PK","92"],["Palau","PW","680"],
  ["Palestine","PS","970"],["Panama","PA","507"],["Papua New Guinea","PG","675"],
  ["Paraguay","PY","595"],["Peru","PE","51"],["Philippines","PH","63"],["Poland","PL","48"],
  ["Portugal","PT","351"],["Puerto Rico","PR","1787"],["Qatar","QA","974"],["Reunion","RE","262"],
  ["Romania","RO","40"],["Russia","RU","7"],["Rwanda","RW","250"],["Saint Helena","SH","290"],
  ["Saint Kitts and Nevis","KN","1869"],["Saint Lucia","LC","1758"],
  ["Saint Pierre and Miquelon","PM","508"],["Saint Vincent","VC","1784"],["Samoa","WS","685"],
  ["San Marino","SM","378"],["Sao Tome and Principe","ST","239"],["Saudi Arabia","SA","966"],
  ["Senegal","SN","221"],["Serbia","RS","381"],["Seychelles","SC","248"],
  ["Sierra Leone","SL","232"],["Singapore","SG","65"],["Slovakia","SK","421"],["Slovenia","SI","386"],
  ["Solomon Islands","SB","677"],["Somalia","SO","252"],["South Africa","ZA","27"],
  ["South Korea","KR","82"],["South Sudan","SS","211"],["Spain","ES","34"],
  ["Sri Lanka","LK","94"],["Sudan","SD","249"],["Suriname","SR","597"],["Sweden","SE","46"],
  ["Switzerland","CH","41"],["Syria","SY","963"],["Taiwan","TW","886"],["Tajikistan","TJ","992"],
  ["Tanzania","TZ","255"],["Thailand","TH","66"],["Togo","TG","228"],["Tokelau","TK","690"],
  ["Tonga","TO","676"],["Trinidad and Tobago","TT","1868"],["Tunisia","TN","216"],
  ["Turkey","TR","90"],["Turkmenistan","TM","993"],["Turks and Caicos","TC","1649"],
  ["Tuvalu","TV","688"],["UAE","AE","971"],["Uganda","UG","256"],["Ukraine","UA","380"],
  ["United Kingdom","GB","44"],["United States","US","1"],["Uruguay","UY","598"],
  ["Uzbekistan","UZ","998"],["Vanuatu","VU","678"],["Venezuela","VE","58"],["Vietnam","VN","84"],
  ["Virgin Islands (British)","VG","1284"],["Virgin Islands (US)","VI","1340"],
  ["Wallis and Futuna","WF","681"],["Western Sahara","EH","212"],["Yemen","YE","967"],
  ["Zambia","ZM","260"],["Zimbabwe","ZW","263"],
];

let currentPhone = "";
let currentPrefix = "91";

function populateCountries() {
  const sel = document.getElementById("country-select");
  sel.innerHTML = "";
  COUNTRIES.forEach(([name, code, dial]) => {
    const opt = document.createElement("option");
    opt.value = dial;
    opt.textContent = `${name} (+${dial})`;
    if (code === "IN") opt.selected = true;
    sel.appendChild(opt);
  });
  updatePrefix();
}

function updatePrefix() {
  const sel = document.getElementById("country-select");
  currentPrefix = sel.value;
  document.getElementById("prefix-display").textContent = "+" + currentPrefix;
}

function showScreen(id) {
  const current = document.querySelector(".screen.active");
  const next = document.getElementById(id);
  if (current && current !== next) {
    current.classList.remove("active");
  }
  next.classList.add("active");
}

function showMainScreen() { showScreen("main-screen"); loadAccounts(); }

function showAddScreen() {
  showScreen("add-screen");
  showStep("step-phone");
  document.getElementById("phone-input").value = "";
  document.getElementById("otp-input").value = "";
  document.getElementById("password-input").value = "";
  document.getElementById("step-2fa").style.display = "none";
}

function goBackToPhone() { showStep("step-phone"); }

function showStep(id) {
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function showLoader(show) {
  const el = document.getElementById("loader");
  el.style.display = show ? "flex" : "none";
}

let _toastTimer;
function showToast(msg, type = "") {
  const el = document.getElementById("toast");
  el.className = "toast";
  el.textContent = msg;
  clearTimeout(_toastTimer);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add("show");
      if (type) el.classList.add(type);
    });
  });
  _toastTimer = setTimeout(() => { el.classList.remove("show", "error", "success"); }, 3200);
}

function esc(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function buildAccountCard(a, index) {
  const isActive = a.active !== false;
  const toggleLabel = isActive ? "Deactivate" : "Activate";
  const toggleClass = isActive ? "toggle-btn toggle-active" : "toggle-btn toggle-inactive";
  const statusDot = isActive ? "dot-active" : "dot-inactive";
  const statusText = isActive ? "Active" : "Inactive";
  const delay = Math.min(index * 60, 300);

  return `<div class="account-card${isActive ? "" : " account-inactive"}" id="card-${esc(a.phone)}" style="animation-delay:${delay}ms">
    <div class="account-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
    <div class="account-body">
      <div class="account-name-row">
        <span class="account-name">${esc(a.name)}</span>
        <span class="status-dot ${statusDot}" title="${statusText}"></span>
      </div>
      ${a.username ? `<div class="account-username">@${esc(a.username)}</div>` : ""}
      <div class="account-phone">${esc(a.phone)}</div>
      ${a.tg_user_id ? `<div class="account-id">ID: ${esc(String(a.tg_user_id))}</div>` : ""}
    </div>
    <div class="account-actions">
      <button class="${toggleClass} btn-ripple" onclick="toggleAccount('${esc(a.phone)}', ${isActive})">${toggleLabel}</button>
      <button class="remove-btn" onclick="removeAccount('${esc(a.phone)}')">Remove</button>
    </div>
  </div>`;
}

async function loadAccounts() {
  const list = document.getElementById("accounts-list");
  list.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div>';

  if (!userId) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg></div>
      <div class="empty-title">No user session</div>
      <div class="empty-sub">Open this panel from the Bumpify bot</div>
    </div>`;
    return;
  }

  try {
    const res = await fetch(`/api/accounts?user_id=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ok) { showToast(data.error || "Failed to load accounts", "error"); list.innerHTML = ""; return; }
    if (!data.accounts.length) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg></div>
        <div class="empty-title">No accounts yet</div>
        <div class="empty-sub">Add your first Telegram account below</div>
      </div>`;
      return;
    }
    list.innerHTML = data.accounts.map((a, i) => buildAccountCard(a, i)).join("");
  } catch (e) {
    showToast("Network error — could not load accounts", "error");
    list.innerHTML = `<div class="empty-state"><div class="empty-title">Failed to load</div><div class="empty-sub">Check your connection</div></div>`;
  }
}

async function toggleAccount(phone, currentlyActive) {
  showLoader(true);
  try {
    const res = await fetch("/api/toggle-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, phone }),
    });
    const data = await res.json();
    if (data.ok) {
      showToast(data.active ? "Account activated" : "Account deactivated", "success");
      await loadAccounts();
    } else {
      showToast(data.error || "Toggle failed", "error");
    }
  } catch { showToast("Network error", "error"); }
  finally { showLoader(false); }
}

async function removeAccount(phone) {
  if (!confirm(`Permanently remove ${phone}?`)) return;
  showLoader(true);
  try {
    const res = await fetch("/api/remove-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, phone }),
    });
    const data = await res.json();
    if (data.ok) { showToast("Account removed", "success"); await loadAccounts(); }
    else showToast(data.error || "Failed to remove", "error");
  } catch { showToast("Network error", "error"); }
  finally { showLoader(false); }
}

async function sendOtp() {
  if (!userId) { showToast("Open this panel from the Bumpify bot", "error"); return; }
  const rawPhone = document.getElementById("phone-input").value.trim().replace(/\D/g, "");
  if (rawPhone.length < 5) { showToast("Enter a valid phone number", "error"); return; }
  currentPhone = currentPrefix + rawPhone;
  const btn = document.querySelector("#step-phone .btn-primary");
  const origHTML = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-inline"></span> Sending...`;
  btn.disabled = true;
  try {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: currentPhone, user_id: userId }),
    });
    const data = await res.json();
    if (data.ok) {
      showToast("OTP sent successfully", "success");
      showStep("step-otp");
      setTimeout(() => document.getElementById("otp-input").focus(), 150);
    } else {
      showToast(data.error || "Failed to send OTP", "error");
    }
  } catch { showToast("Network error — could not send OTP", "error"); }
  finally { btn.innerHTML = origHTML; btn.disabled = false; }
}

async function verifyOtp() {
  const code = document.getElementById("otp-input").value.trim();
  const password = document.getElementById("password-input").value.trim();
  if (!code) { showToast("Enter the verification code", "error"); return; }
  const btn = document.querySelector("#step-otp .btn-primary");
  const origHTML = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-inline"></span> Verifying...`;
  btn.disabled = true;
  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: currentPhone, user_id: userId, code, password: password || undefined }),
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById("success-name").textContent = data.name;
      const parts = [];
      if (data.username) parts.push("@" + data.username);
      if (data.tg_user_id) parts.push("ID: " + data.tg_user_id);
      parts.push(data.phone);
      document.getElementById("success-meta").textContent = parts.join("  ·  ");
      showScreen("success-screen");
    } else if (data.error === "2FA_REQUIRED") {
      document.getElementById("step-2fa").style.display = "flex";
      document.getElementById("step-2fa").style.flexDirection = "column";
      showToast("2FA required — enter your password below", "");
      setTimeout(() => document.getElementById("password-input").focus(), 150);
    } else {
      showToast(data.error || "Verification failed", "error");
    }
  } catch { showToast("Network error — could not verify", "error"); }
  finally { btn.innerHTML = origHTML; btn.disabled = false; }
}

document.addEventListener("keydown", e => {
  const activeStep = document.querySelector(".step.active");
  if (!activeStep) return;
  if (e.key === "Enter") {
    if (activeStep.id === "step-phone") sendOtp();
    else if (activeStep.id === "step-otp") verifyOtp();
  }
});

document.querySelectorAll(".btn-primary").forEach(btn => btn.classList.add("btn-ripple"));

populateCountries();
loadAccounts();
