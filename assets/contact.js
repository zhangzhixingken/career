/* Contact brief — career.zhixingzhang.com/contact.html
 *
 * One page of mostly optional questions builds a short brief. The second screen
 * makes clear the brief has NOT been sent yet: the visitor copies it into an
 * email or WeChat (or opens a pre-filled email). There is no backend.
 */
(() => {
  "use strict";

  // ── Settings ────────────────────────────────────────────────────────────
  const CONFIG = {
    email: "contact@zhixingzhang.com",
    // Optional WeChat ID shown on the send screen. Empty = "send it to me on WeChat" without an ID.
    wechat: ""
  };

  // ── i18n ────────────────────────────────────────────────────────────────
  const T = (en, zh) => ({ en, zh: zh ?? en });
  const html = document.documentElement;
  let lang = html.classList.contains("is-zh") ? "zh" : "en";
  const t = (value) => (value && typeof value === "object" && "en" in value ? value[lang] : value ?? "");
  const opt = (value, en, zh) => ({ value, label: T(en, zh) });
  const sep = () => (lang === "zh" ? "、" : ", ");
  const colon = () => (lang === "zh" ? "：" : ": ");

  const TEXT = {
    title: T("Contact — Zhixing Zhang", "联系 — 张知行 Zhixing Zhang"),
    optional: T("Optional", "选填"),
    many: T("Choose all that apply.", "可多选。"),
    required: T("Choose at least one.", "请至少选择一项。"),
    emailFormat: T("Check the email address.", "请检查邮箱格式。"),
    detailsFor: (label) => label,
    sectionBudget: T("Budget", "预算"),
    sectionContact: T("Your details", "你的联系方式"),
    contactHint: T("All optional — leave whatever is easiest for me to reply to.", "都是选填，留下方便我回复你的方式即可。"),
    next: T("Next: send it to me", "下一步：发给我"),
    previewEmpty: T("Your answers appear here as you go.", "填写的内容会实时显示在这里。"),
    briefTitle: T("Project brief", "项目需求简报"),
    subject: T("Project brief", "项目需求"),
    // Send screen
    pending: T("Not sent yet", "还没有发送"),
    sendTitle: T("One more step — send this brief to me.", "还差一步：把这份简报发给我。"),
    sendLead: T("Nothing has been sent. Copy the brief below and send it to me by email or WeChat — I only receive it once you do.", "目前还没有发出任何内容。请复制下面的简报，通过邮件或微信发给我——你发出之后我才会收到。"),
    copy: T("Copy brief", "复制简报"),
    copied: T("Copied ✓", "已复制 ✓"),
    routeEmail: T("By email", "通过邮件"),
    routeEmailText: () => T(`Paste it into an email to ${CONFIG.email}.`, `粘贴到邮件里，发送至 ${CONFIG.email}。`),
    openMail: T("Or open a pre-filled email ↗", "或打开已填好的邮件 ↗"),
    routeWechat: T("By WeChat", "通过微信"),
    routeWechatText: () => (CONFIG.wechat
      ? T(`Paste it into a WeChat message to ${CONFIG.wechat}.`, `粘贴到微信，发送给 ${CONFIG.wechat}。`)
      : T("Paste it into a WeChat message to me.", "粘贴到微信对话里发给我。")),
    statusCopied: T("Copied. Now paste it into an email or WeChat and send.", "已复制。现在粘贴到邮件或微信里发送。"),
    statusMail: T("Opening your email app — press Send there to deliver it.", "正在打开邮件应用——请在新邮件里点「发送」。"),
    statusNoMail: () => T(`No email app opened on this device. Copy the brief and send it to ${CONFIG.email}, or by WeChat.`, `这台设备没有打开邮件应用。请复制简报，发送至 ${CONFIG.email}，或通过微信发送。`),
    copyFailed: T("Couldn’t copy automatically — select the text below and copy it.", "无法自动复制——请手动选中下面的文字复制。"),
    mailCut: T("[Continues — the full brief is on your clipboard. Please paste it here.]", "［未完——完整简报已复制到剪贴板，请粘贴在这里。］"),
    edit: T("← Edit answers", "← 修改内容"),
    restart: T("Start over", "重新填写")
  };

  // ── Questions ───────────────────────────────────────────────────────────
  const SERVICES = [opt("photography", "Photography", "摄影"), opt("video", "Video", "影像"), opt("design", "Design", "设计"), opt("other", "Other", "其他")];
  const BUDGETS = {
    CNY: [opt("c1", "Under ¥5,000", "¥5,000 以下"), opt("c2", "¥5,000–15,000"), opt("c3", "¥15,000–30,000"), opt("c4", "¥30,000–60,000"), opt("c5", "Over ¥60,000", "¥60,000 以上")],
    USD: [opt("u1", "Under $1,000", "$1,000 以下"), opt("u2", "$1,000–3,000"), opt("u3", "$3,000–8,000"), opt("u4", "$8,000–15,000"), opt("u5", "Over $15,000", "$15,000 以上")]
  };
  const NOT_SURE = opt("unsure", "Not sure yet", "尚不确定");
  const has = (service) => (state) => (state.services || []).includes(service);

  const F = {
    services: { type: "many", large: true, required: true, label: T("Photography, video, design — or something else?", "摄影、影像、设计，还是其他？"), hint: TEXT.many, short: T("Services", "服务"), options: SERVICES },

    photoType: { type: "one", group: "photography", label: T("What kind of photography?", "拍摄类型"), short: T("Type", "类型"),
      options: [opt("event", "Event", "活动"), opt("space", "Architecture & space", "建筑与空间"), opt("product", "Product & still life", "产品与静物"), opt("portrait", "Portrait & team", "人像与团队"), opt("campaign", "Campaign & editorial", "品牌与编辑"), opt("other", "Other", "其他")] },
    photoCoverage: { type: "one", group: "photography", label: T("How long on site?", "拍摄时长"), short: T("On site", "时长"),
      options: [opt("h2", "Up to 2 hours", "2 小时以内"), opt("half", "Half day", "半天"), opt("full", "Full day", "全天"), opt("multi", "Several days", "多天"), opt("unsure", "Not sure", "待定")] },

    videoType: { type: "one", group: "video", label: T("What kind of video?", "影片类型"), short: T("Type", "类型"),
      options: [opt("event", "Event film / recap", "活动影片 / 花絮"), opt("brand", "Brand or promo film", "品牌宣传片"), opt("social", "Short-form social", "社交短视频"), opt("interview", "Interview / documentary", "访谈 / 纪录"), opt("motion", "Motion graphics / AIGC", "动态图形 / AIGC 动画"), opt("other", "Other", "其他")] },
    videoLength: { type: "one", group: "video", label: T("How long is the final film?", "成片时长"), short: T("Length", "时长"),
      options: [opt("s30", "Up to 30 s", "30 秒以内"), opt("s90", "30–90 s", "30–90 秒"), opt("m3", "1.5–3 min", "1.5–3 分钟"), opt("long", "Over 3 min", "3 分钟以上"), opt("unsure", "Not sure", "待定")] },

    designType: { type: "many", group: "design", label: T("What needs designing?", "设计内容"), short: T("Scope", "内容"),
      options: [opt("identity", "Visual identity", "视觉识别"), opt("packaging", "Packaging & product", "包装与产品"), opt("event", "Event visual system", "活动视觉系统"), opt("print", "Print & publication", "印刷与出版物"), opt("digital", "Social & digital", "社交与数字物料"), opt("other", "Other", "其他")] },

    otherScope: { type: "textarea", group: "other", label: T("What do you have in mind?", "你想做什么？"), short: T("Request", "需求"), placeholder: T("e.g. an installation, a workshop, art direction", "例如：装置、工作坊、艺术指导") },

    budget: { type: "budget", label: T("Budget", "预算"), short: T("Budget", "预算") },

    name: { type: "text", autocomplete: "name", label: T("Name", "姓名"), short: T("Name", "姓名") },
    email: { type: "email", autocomplete: "email", label: T("Email", "邮箱"), short: T("Email", "邮箱") },
    wechat: { type: "text", label: T("WeChat ID", "微信号"), short: T("WeChat", "微信") },
    phone: { type: "tel", autocomplete: "tel", label: T("Phone", "电话"), short: T("Phone", "电话") },

    notes: { type: "textarea", label: T("Anything else?", "其他补充"), short: T("Notes", "补充"), placeholder: T("Dates, location, references, anything that helps.", "时间、地点、参考链接，任何有帮助的信息。") }
  };

  const GROUPS = [
    { service: "photography", label: T("Photography", "摄影"), fields: ["photoType", "photoCoverage"] },
    { service: "video", label: T("Video", "影像"), fields: ["videoType", "videoLength"] },
    { service: "design", label: T("Design", "设计"), fields: ["designType"] },
    { service: "other", label: T("Other", "其他"), fields: ["otherScope"] }
  ];

  // ── State ───────────────────────────────────────────────────────────────
  const STORE_KEY = "zzContactBrief";
  const form = document.getElementById("contactForm");
  const preview = document.querySelector("[data-preview]");
  const refSlot = document.querySelector("[data-ref]");
  const layout = form?.closest(".c-brief-layout");
  if (!form) return;

  const makeRef = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let tail = "";
    for (let i = 0; i < 4; i += 1) tail += chars[Math.floor(Math.random() * chars.length)];
    return `ZZ-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${tail}`;
  };

  let state = {};
  let ref = makeRef();
  let screen = "form";

  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && typeof saved.state === "object") {
      state = saved.state;
      if (typeof saved.ref === "string") ref = saved.ref;
    }
  } catch (error) { /* storage unavailable */ }

  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify({ state, ref })); } catch (error) { /* ignore */ } };

  try {
    const param = new URLSearchParams(window.location.search).get("service");
    if (param) {
      const chosen = new Set(state.services || []);
      param.split(",").forEach((value) => { if (SERVICES.some((s) => s.value === value.trim())) chosen.add(value.trim()); });
      state.services = SERVICES.map((s) => s.value).filter((v) => chosen.has(v));
    }
  } catch (error) { /* ignore */ }

  const currency = () => state.currency || "CNY";
  const filled = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim() !== "" : Boolean(v));

  // ── DOM helpers ─────────────────────────────────────────────────────────
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === false || value == null) return;
      if (key === "text") node.textContent = value;
      else if (key === "class") node.className = value;
      else node.setAttribute(key, value === true ? "" : value);
    });
    (Array.isArray(children) ? children : [children]).forEach((child) => child && node.append(child));
    return node;
  };

  const labelFor = (name, value) => {
    const field = F[name];
    const options = field.type === "budget" ? [...BUDGETS.CNY, ...BUDGETS.USD, NOT_SURE] : field.options || [];
    const find = (v) => t(options.find((o) => o.value === v)?.label) || v;
    return Array.isArray(value) ? value.map(find).join(sep()) : find(value);
  };

  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (error) {
      const area = el("textarea", { readonly: true, style: "position:fixed;top:0;left:0;opacity:0" });
      area.value = text;
      document.body.append(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      area.remove();
      return ok;
    }
  };

  // ── Fields ──────────────────────────────────────────────────────────────
  const chips = (name, options, multiple, large) => {
    const wrap = el("div", { class: `c-options${large ? " is-large" : ""}` });
    options.forEach((option) => {
      const id = `f-${name}-${option.value}`;
      const checked = multiple ? (state[name] || []).includes(option.value) : state[name] === option.value;
      wrap.append(el("label", { class: "c-chip", for: id }, [
        el("input", { type: multiple ? "checkbox" : "radio", name, id, value: option.value, checked }),
        el("span", { text: t(option.label) })
      ]));
    });
    return wrap;
  };

  const optionalTag = () => el("span", { class: "c-opt", text: t(TEXT.optional) });

  const field = (name) => {
    const f = F[name];
    if (f.type === "one" || f.type === "many" || f.type === "budget") {
      const set = el("fieldset", { class: "c-field", "data-field": name });
      const legend = el("legend", {}, [document.createTextNode(t(f.label)), f.required ? el("span", { class: "c-req", "aria-hidden": "true", text: " *" }) : optionalTag()]);
      if (f.hint) legend.append(el("span", { class: "c-hint", text: t(f.hint) }));
      set.append(legend);
      if (f.type === "budget") {
        const cur = currency();
        const switcher = el("span", { class: "c-currency", role: "group", "aria-label": lang === "zh" ? "币种" : "Currency" });
        ["CNY", "USD"].forEach((code) => switcher.append(el("button", { type: "button", "data-currency": code, "aria-pressed": String(cur === code), text: code === "CNY" ? "CNY ¥" : "USD $" })));
        legend.insertBefore(switcher, legend.querySelector(".c-opt"));
        set.append(chips(name, [...BUDGETS[cur], NOT_SURE], false));
      } else {
        set.append(chips(name, f.options, f.type === "many", f.large));
      }
      set.append(el("span", { class: "c-error", id: `e-${name}`, role: "alert" }));
      return set;
    }
    const wrap = el("div", { class: "c-field", "data-field": name });
    const id = `f-${name}`;
    wrap.append(el("label", { class: "c-q", for: id }, [document.createTextNode(t(f.label)), optionalTag()]));
    const attrs = { id, name, class: "c-input", autocomplete: f.autocomplete || null, placeholder: f.placeholder ? t(f.placeholder) : null, "aria-describedby": `e-${name}` };
    const input = f.type === "textarea"
      ? el("textarea", { ...attrs, rows: 3 })
      : el("input", { ...attrs, type: f.type === "email" ? "email" : f.type === "tel" ? "tel" : "text", inputmode: f.type === "email" ? "email" : f.type === "tel" ? "tel" : null });
    input.value = state[name] || "";
    wrap.append(input, el("span", { class: "c-error", id: `e-${name}`, role: "alert" }));
    return wrap;
  };

  // ── Screens ─────────────────────────────────────────────────────────────
  const renderForm = () => {
    const box = el("div", { class: "c-step is-active" });
    box.append(field("services"));
    GROUPS.forEach((group) => {
      const section = el("div", { class: "c-detail", "data-group": group.service });
      section.append(el("p", { class: "c-group-title", text: t(group.label) }));
      group.fields.forEach((name) => section.append(field(name)));
      box.append(section);
    });
    box.append(el("p", { class: "c-group-title", text: t(TEXT.sectionBudget) }));
    box.append(field("budget"));
    box.append(el("p", { class: "c-group-title", text: t(TEXT.sectionContact) }));
    box.append(el("p", { class: "c-hint c-hint-block", text: t(TEXT.contactHint) }));
    box.append(el("div", { class: "c-inline" }, [field("name"), field("email")]));
    box.append(el("div", { class: "c-inline" }, [field("wechat"), field("phone")]));
    box.append(field("notes"));
    box.append(el("div", { class: "c-nav" }, el("button", { type: "submit", class: "c-btn", text: t(TEXT.next) })));
    return box;
  };

  const renderSend = () => {
    const box = el("div", { class: "c-step is-active c-send" });
    box.append(el("p", { class: "c-pending", text: t(TEXT.pending) }));
    box.append(el("h2", { class: "c-send-title", tabindex: "-1", text: t(TEXT.sendTitle) }));
    box.append(el("p", { class: "c-send-lead", text: t(TEXT.sendLead) }));
    box.append(el("div", { class: "c-nav c-review-actions" }, el("button", { type: "button", class: "c-btn", "data-action": "copy", text: t(TEXT.copy) })));
    box.append(el("p", { class: "c-status", "data-status": true, role: "status", "aria-live": "polite" }));

    const routes = el("ol", { class: "c-routes" });
    routes.append(el("li", {}, [
      el("strong", { text: t(TEXT.routeEmail) }),
      el("span", { text: t(TEXT.routeEmailText()) }),
      el("button", { type: "button", class: "c-link", "data-action": "email", text: t(TEXT.openMail) })
    ]));
    routes.append(el("li", {}, [
      el("strong", { text: t(TEXT.routeWechat) }),
      el("span", { text: t(TEXT.routeWechatText()) })
    ]));
    box.append(routes);

    box.append(el("div", { class: "c-review-brief", tabindex: "0", "aria-label": t(TEXT.briefTitle), text: briefText() }));
    box.append(el("div", { class: "c-nav" }, [
      el("button", { type: "button", class: "c-link", "data-action": "edit", text: t(TEXT.edit) }),
      el("button", { type: "button", class: "c-link", "data-action": "restart", text: t(TEXT.restart) })
    ]));
    return box;
  };

  const render = (focus = false) => {
    form.replaceChildren(screen === "send" ? renderSend() : renderForm());
    layout?.classList.toggle("is-review", screen === "send");
    refreshGroups();
    updatePreview();
    if (focus) {
      const top = form.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(0, top), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      form.querySelector(".c-send-title")?.focus({ preventScroll: true });
    }
  };

  const refreshGroups = () => {
    form.querySelectorAll("[data-group]").forEach((node) => { node.hidden = !(state.services || []).includes(node.dataset.group); });
  };

  // ── Brief ───────────────────────────────────────────────────────────────
  const buildBrief = () => {
    const sections = [];
    const rows = (names) => names.map((name) => (filled(state[name]) ? [t(F[name].short), F[name].options || F[name].type === "budget" ? labelFor(name, state[name]) : String(state[name]).trim()] : null)).filter(Boolean);
    const push = (title, names) => { const r = rows(names); if (r.length) sections.push({ title, rows: r }); };
    push(T("Project", "项目"), ["services"]);
    GROUPS.forEach((g) => { if (has(g.service)(state)) push(g.label, g.fields); });
    push(TEXT.sectionBudget, ["budget"]);
    push(TEXT.sectionContact, ["name", "email", "wechat", "phone"]);
    push(T("Notes", "补充"), ["notes"]);
    return sections;
  };

  const briefText = () => {
    const lines = [`${t(TEXT.briefTitle)} · ${ref}`, ""];
    buildBrief().forEach((section) => {
      const title = t(section.title);
      lines.push(lang === "zh" ? `【${title}】` : title.toUpperCase());
      section.rows.forEach(([label, value]) => lines.push(section.rows.length === 1 && label === title ? value : `${label}${colon()}${value}`));
      lines.push("");
    });
    return lines.join("\n").trim();
  };

  const updatePreview = () => {
    if (refSlot) refSlot.textContent = ref;
    if (!preview) return;
    const sections = buildBrief();
    preview.replaceChildren();
    if (!sections.length) { preview.append(el("p", { class: "c-preview-empty", text: t(TEXT.previewEmpty) })); return; }
    sections.forEach((section) => {
      preview.append(el("h3", { text: t(section.title) }));
      const list = el("dl");
      section.rows.forEach(([label, value]) => list.append(el("dt", { text: label }), el("dd", { text: value })));
      preview.append(list);
    });
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!filled(state.services)) errors.services = TEXT.required;
    const email = (state.email || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = TEXT.emailFormat;
    form.querySelectorAll("[data-field]").forEach((node) => {
      const name = node.dataset.field;
      const message = errors[name] ? t(errors[name]) : "";
      node.classList.toggle("has-error", Boolean(message));
      const slot = node.querySelector(".c-error");
      if (slot) slot.textContent = message;
    });
    const first = Object.keys(errors)[0];
    if (first) {
      const target = form.querySelector(`[name="${first}"]`);
      target?.focus({ preventScroll: true });
      target?.closest("[data-field]")?.scrollIntoView({ block: "center" });
    }
    return !first;
  };

  // ── Sending helpers ─────────────────────────────────────────────────────
  const status = (message) => { const slot = form.querySelector("[data-status]"); if (slot) slot.textContent = t(message); };

  const subjectLine = () => {
    const services = labelFor("services", state.services || []);
    const subject = `${t(TEXT.subject)} ${ref} — ${services}`;
    return subject.length > 140 ? `${subject.slice(0, 137)}…` : subject;
  };

  const openMail = async () => {
    const full = briefText();
    const limit = 1900;
    const base = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subjectLine())}&body=`;
    let body = full;
    if ((base + encodeURIComponent(body)).length > limit) {
      await copyText(full);
      const chars = Array.from(full);
      const tail = `…\n\n${t(TEXT.mailCut)}`;
      const fits = (n) => (base + encodeURIComponent(chars.slice(0, n).join("") + tail)).length <= limit;
      let low = 0;
      let high = chars.length;
      while (low < high) { const mid = Math.ceil((low + high) / 2); if (fits(mid)) low = mid; else high = mid - 1; }
      body = chars.slice(0, low).join("").replace(/\s+$/, "") + tail;
    }
    status(TEXT.statusMail);
    let left = false;
    const onLeave = () => { left = true; };
    window.addEventListener("blur", onLeave, { once: true });
    document.addEventListener("visibilitychange", onLeave, { once: true });
    window.location.href = base + encodeURIComponent(body);
    window.setTimeout(() => {
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onLeave);
      if (!left && document.hasFocus()) status(TEXT.statusNoMail());
    }, 1600);
  };

  // ── Events ──────────────────────────────────────────────────────────────
  const readInput = (input) => {
    const { name } = input;
    if (!name || !F[name]) return;
    if (input.type === "checkbox") {
      state[name] = [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((n) => n.value);
    } else if (input.type === "radio") {
      // Clicking a selected option again clears it — every question but services is optional.
      state[name] = input.value;
    } else {
      state[name] = input.value;
    }
    const node = input.closest("[data-field]");
    if (node?.classList.contains("has-error")) { node.classList.remove("has-error"); node.querySelector(".c-error").textContent = ""; }
    save();
    refreshGroups();
    updatePreview();
  };

  form.addEventListener("input", (e) => { if (e.target.matches("input:not([type=radio]):not([type=checkbox]), textarea")) readInput(e.target); });
  form.addEventListener("change", (e) => { if (e.target.matches("input[type=radio], input[type=checkbox]")) readInput(e.target); });

  // Let a chosen single-choice answer be cleared by clicking it again.
  form.addEventListener("click", (e) => {
    const chip = e.target.closest(".c-chip");
    if (!chip) return;
    const input = chip.querySelector("input[type=radio]");
    if (input && input.checked && state[input.name] === input.value && e.target === input) {
      input.checked = false;
      delete state[input.name];
      save();
      updatePreview();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (screen !== "form" || !validate()) return;
    screen = "send";
    render(true);
  });

  form.addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    if (button.dataset.currency) {
      state.currency = button.dataset.currency;
      if (state.budget && state.budget !== "unsure") delete state.budget;
      save();
      form.querySelector('[data-field="budget"]').replaceWith(field("budget"));
      form.querySelector(`[data-currency="${state.currency}"]`)?.focus();
      updatePreview();
      return;
    }
    const action = button.dataset.action;
    if (action === "copy") {
      const ok = await copyText(briefText());
      if (ok) { button.textContent = t(TEXT.copied); status(TEXT.statusCopied); window.setTimeout(() => { button.textContent = t(TEXT.copy); }, 2400); } else status(TEXT.copyFailed);
    } else if (action === "email") {
      await openMail();
    } else if (action === "edit") {
      screen = "form";
      render(true);
    } else if (action === "restart") {
      state = {};
      ref = makeRef();
      screen = "form";
      try { localStorage.removeItem(STORE_KEY); } catch (error) { /* ignore */ }
      render(true);
    }
  });

  // ── Language ────────────────────────────────────────────────────────────
  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      lang = lang === "zh" ? "en" : "zh";
      html.classList.toggle("is-zh", lang === "zh");
      html.lang = lang === "zh" ? "zh-Hans" : "en";
      document.title = t(TEXT.title);
      try { localStorage.setItem("zzLang", lang); } catch (error) { /* ignore */ }
      render(false);
    });
  });

  document.title = t(TEXT.title);
  render(false);
})();
