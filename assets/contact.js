/* Contact brief builder — career.zhixingzhang.com/contact/
 *
 * The form turns a client's answers into a structured brief, then sends it by
 * email (mailto), copies it for WeChat, or — if CONFIG.endpoint is set — posts
 * it to a form service. No backend is required for the email/copy routes.
 */
(() => {
  "use strict";

  // ── Settings ────────────────────────────────────────────────────────────
  const CONFIG = {
    email: "contact@zhixingzhang.com",
    // Optional form-service URL (e.g. a Formspree form URL). Empty = email/copy only.
    endpoint: "",
    // Extra public fields a form service may require (e.g. { access_key: "…" }).
    endpointFields: {},
    // Optional WeChat ID shown on the review step. Empty = hidden.
    wechat: ""
  };

  // ── i18n ────────────────────────────────────────────────────────────────
  const T = (en, zh) => ({ en, zh: zh ?? en });
  const html = document.documentElement;
  let lang = html.classList.contains("is-zh") ? "zh" : "en";
  const t = (value) => (value && typeof value === "object" && "en" in value ? value[lang] : value ?? "");
  const opt = (value, en, zh) => ({ value, label: T(en, zh) });
  const UNSURE = opt("unsure", "Not sure", "待定");

  const TEXT = {
    steps: [T("Project", "项目"), T("Details", "细节"), T("When & budget", "时间与预算"), T("Contact", "联系方式"), T("Review", "确认")],
    stepOf: (i, n) => T(`Step ${i} of ${n}`, `第 ${i} / ${n} 步`),
    next: T("Next", "下一步"),
    back: T("Back", "上一步"),
    review: T("Review brief", "预览简报"),
    send: T("Send brief", "提交需求"),
    email: T("Send by email", "通过邮件发送"),
    emailAlt: T("Send by email instead", "改用邮件发送"),
    copy: T("Copy brief", "复制简报"),
    restart: T("Start over", "重新填写"),
    required: T("Please answer this.", "请填写此项。"),
    requiredChoice: T("Choose at least one.", "请至少选择一项。"),
    channel: T("Add an email, WeChat ID or phone number.", "请至少留下邮箱、微信号或电话。"),
    emailFormat: T("Check the email address.", "请检查邮箱格式。"),
    preferredMissing: (channel) => ({
      email: T("Add your email address above, or choose another option.", "请在上方填写邮箱，或选择其他方式。"),
      wechat: T("Add your WeChat ID above, or choose another option.", "请在上方填写微信号，或选择其他方式。"),
      phone: T("Add your phone number above, or choose another option.", "请在上方填写电话，或选择其他方式。")
    })[channel],
    optional: T("Optional.", "选填。"),
    many: T("Choose all that apply.", "可多选。"),
    briefTitle: T("Project brief", "项目需求简报"),
    subject: T("Project brief", "项目需求"),
    notFixed: T("Not fixed yet", "待定"),
    previewEmpty: T("Your answers appear here as you go.", "填写的内容会实时显示在这里。"),
    reviewTitle: T("Check the brief, then send it.", "确认简报内容后发送。"),
    noteEmail: () => T(`This opens a new email to ${CONFIG.email} with the brief already filled in. Press Send in your email app and it reaches me.`, `点击后会打开你的邮件应用，新邮件已填好收件人 ${CONFIG.email} 和简报内容，在邮件里点「发送」即可送达。`),
    noteEndpoint: T("The brief comes straight to me; I reply through the contact you chose.", "提交后简报会直接发送给我，我会通过你选择的方式回复。"),
    noteWechat: () => T(`Or copy it and send it on WeChat: ${CONFIG.wechat}`, `也可以复制后通过微信发送：${CONFIG.wechat}`),
    statusEmail: T("Opening your email app — press Send there to deliver the brief.", "正在打开邮件应用，请在新邮件里点「发送」。"),
    statusNoMail: () => T(`No email app opened on this device. Copy the brief and send it to ${CONFIG.email} from any mailbox, or by WeChat.`, `这台设备没有打开邮件应用。请复制简报，用任意邮箱发送至 ${CONFIG.email}，或通过微信发送。`),
    statusCopied: T("Brief copied — paste it into an email or WeChat.", "简报已复制，可粘贴到邮件或微信发送。"),
    statusSent: (ref) => T(`Sent — thank you. Your reference is ${ref}.`, `已提交，谢谢。你的编号是 ${ref}。`),
    statusFailed: T("That didn’t go through. Email or copy the brief instead.", "提交未成功，请改用邮件发送或复制简报。"),
    mailCut: T("[Continues — the full brief is on your clipboard. Please paste it here.]", "［未完——完整简报已复制到剪贴板，请粘贴在这里。］"),
    title: T("Contact — Zhixing Zhang", "联系 — 张知行 Zhixing Zhang")
  };

  // ── Brief schema ────────────────────────────────────────────────────────
  const SERVICES = [opt("photography", "Photography", "摄影"), opt("video", "Video", "影像"), opt("design", "Design", "设计")];

  const BUDGETS = {
    CNY: [opt("c1", "Under ¥5,000", "¥5,000 以下"), opt("c2", "¥5,000–15,000"), opt("c3", "¥15,000–30,000"), opt("c4", "¥30,000–60,000"), opt("c5", "Over ¥60,000", "¥60,000 以上")],
    USD: [opt("u1", "Under $1,000", "$1,000 以下"), opt("u2", "$1,000–3,000"), opt("u3", "$3,000–8,000"), opt("u4", "$8,000–15,000"), opt("u5", "Over $15,000", "$15,000 以上")]
  };
  const BUDGET_UNSURE = opt("unsure", "Not sure yet", "尚不确定");

  const has = (service) => (state) => (state.services || []).includes(service);

  const F = {
    services: { type: "many", large: true, required: true, label: T("What do you need?", "需要哪些服务？"), hint: TEXT.many, short: T("Services", "服务"), options: SERVICES },
    summary: { type: "text", required: true, max: 160, label: T("The project in one line", "用一句话描述项目"), short: T("Summary", "概述"), placeholder: T("e.g. Event film and photos for a product launch in March", "例如：三月新品发布会的活动影片与照片") },

    photoType: { type: "one", required: true, when: has("photography"), label: T("What kind of photography?", "拍摄类型"), short: T("Type", "类型"),
      options: [opt("event", "Event", "活动"), opt("space", "Architecture & space", "建筑与空间"), opt("product", "Product & still life", "产品与静物"), opt("portrait", "Portrait & team", "人像与团队"), opt("campaign", "Campaign & editorial", "品牌与编辑"), opt("other", "Other", "其他")] },
    photoCoverage: { type: "one", when: has("photography"), label: T("How long on site?", "现场拍摄时长"), short: T("On site", "拍摄时长"),
      options: [opt("h2", "Up to 2 hours", "2 小时以内"), opt("half", "Half day", "半天"), opt("full", "Full day", "全天"), opt("multi", "Several days", "多天"), UNSURE] },
    photoImages: { type: "one", when: has("photography"), label: T("How many final images?", "交付照片数量"), short: T("Final images", "照片数量"),
      options: [opt("i20", "Up to 20", "20 张以内"), opt("i60", "20–60", "20–60 张"), opt("i150", "60–150", "60–150 张"), opt("i150p", "150+", "150 张以上"), UNSURE] },
    photoExtras: { type: "many", when: has("photography"), label: T("Anything extra?", "附加需求"), hint: TEXT.optional, short: T("Extras", "附加"),
      options: [opt("sameday", "Same-day selects for social", "当日出精选图"), opt("retouch", "High-end retouching", "高级精修"), opt("raw", "Unedited source files", "原片文件")] },

    videoType: { type: "one", required: true, when: has("video"), label: T("What kind of video?", "影片类型"), short: T("Type", "类型"),
      options: [opt("event", "Event film / recap", "活动影片 / 花絮"), opt("brand", "Brand or promo film", "品牌宣传片"), opt("social", "Short-form social", "社交短视频"), opt("interview", "Interview / documentary", "访谈 / 纪录"), opt("motion", "Motion graphics / AIGC", "动态图形 / AIGC 动画"), opt("title", "Title sequence", "片头"), opt("other", "Other", "其他")] },
    videoLength: { type: "one", when: has("video"), label: T("Final length?", "成片时长"), short: T("Length", "时长"),
      options: [opt("s30", "Up to 30 s", "30 秒以内"), opt("s90", "30–90 s", "30–90 秒"), opt("m3", "1.5–3 min", "1.5–3 分钟"), opt("long", "Over 3 min", "3 分钟以上"), UNSURE] },
    videoFilming: { type: "one", when: has("video"), label: T("How much filming?", "拍摄天数"), short: T("Filming", "拍摄"),
      options: [opt("none", "None — edit or animation only", "无需拍摄（仅剪辑或动画）"), opt("d1", "1 day", "1 天"), opt("d3", "2–3 days", "2–3 天"), opt("d4", "4+ days", "4 天以上"), UNSURE] },
    videoRatios: { type: "many", when: has("video"), label: T("Which formats?", "画幅比例"), hint: TEXT.many, short: T("Formats", "画幅"),
      options: [opt("169", "16:9 horizontal", "16:9 横屏"), opt("916", "9:16 vertical", "9:16 竖屏"), opt("11", "1:1 square", "1:1 方形"), opt("45", "4:5")] },
    videoPlatforms: { type: "many", when: has("video"), label: T("Where will it run?", "发布平台"), hint: TEXT.many, short: T("Platforms", "平台"),
      options: [opt("channels", "WeChat Channels", "视频号"), opt("douyin", "Douyin", "抖音"), opt("xhs", "Xiaohongshu", "小红书"), opt("bilibili", "Bilibili", "哔哩哔哩"), opt("instagram", "Instagram"), opt("youtube", "YouTube"), opt("web", "Website", "官网"), opt("screen", "Event screen", "现场大屏")] },
    videoExtras: { type: "many", when: has("video"), label: T("Anything extra?", "附加需求"), hint: TEXT.optional, short: T("Extras", "附加"),
      options: [opt("script", "Script & storyboard", "脚本与分镜"), opt("subzh", "Chinese subtitles", "中文字幕"), opt("suben", "English subtitles", "英文字幕"), opt("vo", "Voice-over", "配音"), opt("music", "Licensed music", "正版音乐授权"), opt("cutdowns", "Extra cut-downs", "多版本剪辑")] },

    designType: { type: "many", required: true, when: has("design"), label: T("What needs designing?", "设计内容"), hint: TEXT.many, short: T("Scope", "内容"),
      options: [opt("identity", "Visual identity", "视觉识别"), opt("packaging", "Packaging & product", "包装与产品"), opt("event", "Event visual system", "活动视觉系统"), opt("print", "Print & publication", "印刷与出版物"), opt("digital", "Social & digital assets", "社交与数字物料"), opt("other", "Other", "其他")] },
    designGuidelines: { type: "one", when: has("design"), label: T("Do you have brand guidelines?", "是否已有品牌规范？"), short: T("Guidelines", "品牌规范"),
      options: [opt("yes", "Yes", "有"), opt("partly", "Partly", "部分有"), opt("no", "No", "没有")] },

    date: { type: "date", flag: "dateOpen", flagLabel: T("Not fixed yet", "日期待定"), label: T("Shoot, event or start date", "拍摄、活动或启动日期"), short: T("Date", "日期") },
    deadline: { type: "date", label: T("Final delivery by", "最终交付日期"), hint: TEXT.optional, short: T("Deliver by", "交付") },
    city: { type: "one", label: T("Where?", "地点"), short: T("City", "城市"),
      options: [opt("shanghai", "Shanghai", "上海"), opt("shenzhen", "Shenzhen", "深圳"), opt("newyork", "New York", "纽约"), opt("remote", "Remote — no travel", "远程（无需到场）"), opt("other", "Elsewhere", "其他城市")] },
    cityOther: { type: "text", when: (s) => s.city === "other", label: T("Which city?", "哪个城市？"), short: T("City", "城市"), placeholder: T("City, country", "城市") },
    venue: { type: "text", label: T("Venue", "场地"), hint: TEXT.optional, short: T("Venue", "场地"), placeholder: T("e.g. hotel ballroom, campus, studio", "例如：酒店宴会厅、校园、摄影棚") },
    budget: { type: "budget", required: true, label: T("Budget", "预算"), hint: T("A range is enough — it sets the scale of the proposal, not a fixed price.", "给出范围即可——它用来确定方案规模，并非最终报价。"), short: T("Budget", "预算") },
    usage: { type: "many", label: T("Where will the work be used?", "作品用途"), hint: T("This sets the licence. Choose all that apply.", "会影响授权范围，可多选。"), short: T("Usage", "用途"),
      options: [opt("social", "Social media", "社交媒体"), opt("web", "Website", "官网"), opt("print", "Print & PR", "印刷与公关"), opt("ads", "Paid advertising", "付费广告"), opt("internal", "Internal", "内部使用"), opt("broadcast", "Broadcast & public screens", "电视与公共屏幕")] },

    name: { type: "text", required: true, autocomplete: "name", label: T("Your name", "姓名"), short: T("Name", "姓名") },
    org: { type: "text", autocomplete: "organization", label: T("Organisation", "机构 / 公司"), hint: TEXT.optional, short: T("Organisation", "机构") },
    email: { type: "email", autocomplete: "email", label: T("Email", "邮箱"), short: T("Email", "邮箱") },
    wechat: { type: "text", label: T("WeChat ID", "微信号"), short: T("WeChat", "微信") },
    phone: { type: "tel", autocomplete: "tel", label: T("Phone", "电话"), short: T("Phone", "电话") },
    preferred: { type: "one", label: T("Best way to reach you", "首选联系方式"), short: T("Reply via", "回复方式"),
      options: [opt("email", "Email", "邮件"), opt("wechat", "WeChat", "微信"), opt("phone", "Phone", "电话")] },
    references: { type: "textarea", label: T("References", "参考"), hint: T("Links to work you like, mood boards, a previous version — anything that shows the direction.", "你喜欢的作品、情绪板、过往版本的链接——任何能说明方向的内容。"), short: T("References", "参考") },
    notes: { type: "textarea", label: T("Anything else?", "其他补充"), hint: T("Audience, key messages, constraints, people involved.", "受众、核心信息、限制条件、参与人员等。"), short: T("Notes", "补充") }
  };

  const GROUP = (service, label) => ({ heading: label, when: has(service) });
  const STEPS = [
    ["services", "summary"],
    [GROUP("photography", T("Photography", "摄影")), "photoType", "photoCoverage", "photoImages", "photoExtras",
     GROUP("video", T("Video", "影像")), "videoType", "videoLength", "videoFilming", "videoRatios", "videoPlatforms", "videoExtras",
     GROUP("design", T("Design", "设计")), "designType", "designGuidelines"],
    [["date", "deadline"], "city", "cityOther", "venue", "budget", "usage"],
    [["name", "org"], ["email", "wechat"], ["phone", "preferred"], "references", "notes"],
    "review"
  ];
  const STEP_FIELDS = STEPS.map((step) => (Array.isArray(step) ? step.flat().filter((item) => typeof item === "string") : []));

  // ── State ───────────────────────────────────────────────────────────────
  const STORE_KEY = "zzContactDraft";
  const form = document.getElementById("contactForm");
  const preview = document.querySelector("[data-preview]");
  const refSlot = document.querySelector("[data-ref]");
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
  let step = 0;
  let reached = 0;
  let sent = false;
  let honey = "";

  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && typeof saved.state === "object") {
      state = saved.state;
      if (typeof saved.ref === "string") ref = saved.ref;
    }
  } catch (error) { /* storage unavailable */ }

  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ state, ref })); } catch (error) { /* ignore */ }
  };

  const addService = (service) => {
    if (!SERVICES.some((item) => item.value === service)) return;
    const list = new Set(state.services || []);
    list.add(service);
    state.services = SERVICES.map((item) => item.value).filter((value) => list.has(value));
  };

  try {
    const param = new URLSearchParams(window.location.search).get("service");
    if (param) param.split(",").forEach((service) => addService(service.trim()));
  } catch (error) { /* ignore */ }

  const currency = () => state.currency || (state.city === "newyork" ? "USD" : "CNY");
  const isVisible = (name) => !F[name].when || F[name].when(state);
  const filled = (value) => (Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.trim() !== "" : Boolean(value));

  // ── Helpers ─────────────────────────────────────────────────────────────
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
    if (field.type === "budget") {
      const all = [...BUDGETS.CNY, ...BUDGETS.USD, BUDGET_UNSURE];
      return t(all.find((item) => item.value === value)?.label) || "";
    }
    const options = field.options || [];
    if (Array.isArray(value)) return value.map((v) => t(options.find((item) => item.value === v)?.label)).filter(Boolean).join(lang === "zh" ? "、" : ", ");
    return t(options.find((item) => item.value === value)?.label) || value || "";
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
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

  // ── Rendering fields ────────────────────────────────────────────────────
  const errorNode = (name) => el("span", { class: "c-error", id: `e-${name}`, role: "alert" });

  const hintNode = (field, name) => (field.hint ? el("span", { class: "c-hint", id: `h-${name}`, text: t(field.hint) }) : null);

  const chipGroup = (name, options, multiple, large) => {
    const wrap = el("div", { class: `c-options${large ? " is-large" : ""}` });
    const current = state[name];
    options.forEach((option) => {
      const id = `f-${name}-${option.value}`;
      const checked = multiple ? (current || []).includes(option.value) : current === option.value;
      wrap.append(el("label", { class: "c-chip", for: id }, [
        el("input", { type: multiple ? "checkbox" : "radio", name, id, value: option.value, checked }),
        el("span", { text: t(option.label) })
      ]));
    });
    return wrap;
  };

  const renderField = (name) => {
    const field = F[name];
    const required = field.required ? el("span", { class: "c-req", "aria-hidden": "true", text: " *" }) : null;
    const describedBy = [field.hint ? `h-${name}` : null, `e-${name}`].filter(Boolean).join(" ");

    if (field.type === "one" || field.type === "many" || field.type === "budget") {
      const fieldset = el("fieldset", { class: "c-field", "data-field": name, "aria-describedby": describedBy });
      const legend = el("legend", {}, [document.createTextNode(t(field.label)), required, hintNode(field, name)]);
      fieldset.append(legend);
      if (field.type === "budget") {
        const cur = currency();
        const switcher = el("span", { class: "c-currency", role: "group", "aria-label": lang === "zh" ? "币种" : "Currency" });
        ["CNY", "USD"].forEach((code) => switcher.append(el("button", { type: "button", "data-currency": code, "aria-pressed": String(cur === code), text: code === "CNY" ? "CNY ¥" : "USD $" })));
        legend.insertBefore(switcher, legend.querySelector(".c-hint"));
        fieldset.append(chipGroup(name, [...BUDGETS[cur], BUDGET_UNSURE], false));
      } else {
        fieldset.append(chipGroup(name, field.options, field.type === "many", field.large));
      }
      fieldset.append(errorNode(name));
      return fieldset;
    }

    const wrap = el("div", { class: "c-field", "data-field": name });
    const id = `f-${name}`;
    wrap.append(el("label", { class: "c-q", for: id }, [document.createTextNode(t(field.label)), required, hintNode(field, name)]));
    const common = { id, name, class: "c-input", "aria-describedby": describedBy, "aria-required": field.required ? "true" : null, autocomplete: field.autocomplete || null, placeholder: field.placeholder ? t(field.placeholder) : null, maxlength: field.max || null };
    let input;
    if (field.type === "textarea") {
      input = el("textarea", { ...common, rows: 3 });
      input.value = state[name] || "";
    } else if (field.type === "date") {
      const today = new Date();
      const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      input = el("input", { ...common, type: "date", min: iso, disabled: field.flag && state[field.flag] ? true : null });
      input.value = state[name] || "";
    } else {
      input = el("input", { ...common, type: field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text", inputmode: field.type === "email" ? "email" : field.type === "tel" ? "tel" : null });
      input.value = state[name] || "";
    }
    wrap.append(input);
    if (field.flag) {
      wrap.append(el("label", { class: "c-check" }, [el("input", { type: "checkbox", name: field.flag, checked: Boolean(state[field.flag]) }), el("span", { text: t(field.flagLabel) })]));
    }
    wrap.append(errorNode(name));
    return wrap;
  };

  const stepNav = () => {
    const list = el("ol", { class: "c-steps" });
    TEXT.steps.forEach((label, index) => {
      const done = index <= reached && index !== step;
      list.append(el("li", {}, el("button", {
        type: "button",
        "data-goto": index,
        class: done ? "is-done" : null,
        "aria-current": index === step ? "step" : null,
        "aria-disabled": index > reached ? "true" : null
      }, [el("span", { text: String(index + 1).padStart(2, "0") }), document.createTextNode(t(label))])));
    });
    return list;
  };

  const actions = () => {
    const bar = el("div", { class: "c-nav" });
    if (step < STEPS.length - 2) bar.append(el("button", { type: "submit", class: "c-btn", text: t(TEXT.next) }));
    else if (step === STEPS.length - 2) bar.append(el("button", { type: "submit", class: "c-btn", text: t(TEXT.review) }));
    if (step > 0) bar.append(el("button", { type: "button", class: "c-link", "data-back": true, text: `← ${t(TEXT.back)}` }));
    return bar;
  };

  const renderReview = (container) => {
    const brief = buildBrief();
    container.append(el("p", { class: "c-group-title", text: t(TEXT.reviewTitle) }));

    const bar = el("div", { class: "c-nav c-review-actions" });
    if (CONFIG.endpoint) {
      bar.append(el("button", { type: "button", class: "c-btn", "data-action": "send", disabled: sent ? true : null, text: t(TEXT.send) }));
      bar.append(el("button", { type: "button", class: "c-btn is-ghost", "data-action": "copy", text: t(TEXT.copy) }));
      bar.append(el("button", { type: "button", class: "c-link", "data-action": "email", text: t(TEXT.emailAlt) }));
    } else {
      bar.append(el("button", { type: "button", class: "c-btn", "data-action": "email", text: t(TEXT.email) }));
      bar.append(el("button", { type: "button", class: "c-btn is-ghost", "data-action": "copy", text: t(TEXT.copy) }));
    }
    container.append(bar);

    container.append(el("p", { class: "c-review-note", text: t(CONFIG.endpoint ? TEXT.noteEndpoint : TEXT.noteEmail()) }));
    if (CONFIG.wechat) container.append(el("p", { class: "c-review-note", text: t(TEXT.noteWechat()) }));
    container.append(el("p", { class: "c-status", "data-status": true, role: "status", "aria-live": "polite" }));
    container.append(el("div", { class: "c-review-brief", tabindex: "0", "aria-label": t(TEXT.briefTitle), text: briefText(brief) }));

    const after = el("div", { class: "c-nav" }, [
      el("button", { type: "button", class: "c-link", "data-back": true, text: `← ${t(TEXT.back)}` }),
      el("button", { type: "button", class: "c-link", "data-action": "restart", text: t(TEXT.restart) })
    ]);
    container.append(after);
  };

  const render = (focusTitle = false) => {
    form.replaceChildren();
    form.append(stepNav());
    const container = el("div", { class: "c-step is-active", "data-step": step });
    const title = el("p", { class: "c-step-title", tabindex: "-1", text: `${t(TEXT.stepOf(step + 1, STEPS.length))} · ${t(TEXT.steps[step])}` });
    container.append(title);

    if (STEPS[step] === "review") {
      renderReview(container);
    } else {
      STEPS[step].forEach((item) => {
        if (typeof item === "string") {
          container.append(renderField(item));
        } else if (Array.isArray(item)) {
          container.append(el("div", { class: "c-inline" }, item.map(renderField)));
        } else if (item.heading) {
          const heading = el("p", { class: "c-group-title", text: t(item.heading) });
          heading.dataset.when = SERVICES.find((service) => item.when({ services: [service.value] }))?.value || "";
          container.append(heading);
        }
      });
      container.append(actions());
      container.append(el("input", { class: "c-honey", type: "text", name: "website", tabindex: "-1", autocomplete: "off", "aria-hidden": "true" }));
    }

    form.append(container);
    form.closest(".c-brief-layout")?.classList.toggle("is-review", STEPS[step] === "review");
    refreshVisibility();
    updatePreview();
    if (focusTitle) {
      title.focus({ preventScroll: true });
      const top = form.getBoundingClientRect().top + window.scrollY - 110;
      if (window.scrollY > top) window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  };

  const refreshVisibility = () => {
    form.querySelectorAll("[data-field]").forEach((node) => { node.hidden = !isVisible(node.dataset.field); });
    form.querySelectorAll(".c-group-title[data-when]").forEach((node) => { node.hidden = node.dataset.when ? !(state.services || []).includes(node.dataset.when) : false; });
    form.querySelectorAll(".c-inline").forEach((row) => { row.hidden = [...row.children].every((child) => child.hidden); });
  };

  // ── Brief ───────────────────────────────────────────────────────────────
  const buildBrief = () => {
    const sections = [];
    const rows = (names) => names.filter((name) => isVisible(name)).map((name) => {
      const field = F[name];
      let value = state[name];
      if (name === "date" && state.dateOpen) return [t(field.short), t(TEXT.notFixed)];
      if (name === "city" && value === "other" && filled(state.cityOther)) return [t(field.short), state.cityOther.trim()];
      if (name === "cityOther") return null;
      if (!filled(value)) return null;
      if (field.options || field.type === "budget") value = labelFor(name, value);
      return [t(field.short), String(value).trim()];
    }).filter(Boolean);

    const push = (title, names) => {
      const list = rows(names);
      if (list.length) sections.push({ title, rows: list });
    };

    push(T("Project", "项目"), ["services", "summary"]);
    if (has("photography")(state)) push(T("Photography", "摄影"), ["photoType", "photoCoverage", "photoImages", "photoExtras"]);
    if (has("video")(state)) push(T("Video", "影像"), ["videoType", "videoLength", "videoFilming", "videoRatios", "videoPlatforms", "videoExtras"]);
    if (has("design")(state)) push(T("Design", "设计"), ["designType", "designGuidelines"]);
    push(T("When & budget", "时间与预算"), ["date", "deadline", "city", "cityOther", "venue", "budget", "usage"]);
    push(T("Contact", "联系方式"), ["name", "org", "email", "wechat", "phone", "preferred"]);
    push(T("Direction", "方向"), ["references", "notes"]);
    return sections;
  };

  const briefText = (sections = buildBrief()) => {
    const lines = [`${t(TEXT.briefTitle)} · ${ref}`, ""];
    sections.forEach((section) => {
      lines.push(t(section.title).toUpperCase());
      section.rows.forEach(([label, value]) => lines.push(`${label}${lang === "zh" ? "：" : ": "}${value}`));
      lines.push("");
    });
    return lines.join("\n").trim();
  };

  const updatePreview = () => {
    if (refSlot) refSlot.textContent = ref;
    if (!preview) return;
    const sections = buildBrief();
    preview.replaceChildren();
    if (!sections.length) {
      preview.append(el("p", { class: "c-preview-empty", text: t(TEXT.previewEmpty) }));
      return;
    }
    sections.forEach((section) => {
      preview.append(el("h3", { text: t(section.title) }));
      const list = el("dl");
      section.rows.forEach(([label, value]) => list.append(el("dt", { text: label }), el("dd", { text: value })));
      preview.append(list);
    });
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = (index) => {
    const errors = {};
    STEP_FIELDS[index].forEach((name) => {
      const field = F[name];
      if (!field.required || !isVisible(name)) return;
      if (!filled(state[name])) errors[name] = field.type === "many" ? TEXT.requiredChoice : TEXT.required;
    });
    if (index === 3) {
      const email = (state.email || "").trim();
      if (!filled(state.email) && !filled(state.wechat) && !filled(state.phone)) errors.email = TEXT.channel;
      else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = TEXT.emailFormat;
      if (state.preferred && !filled(state[state.preferred])) errors.preferred = TEXT.preferredMissing(state.preferred);
    }
    return errors;
  };

  const showErrors = (errors) => {
    form.querySelectorAll("[data-field]").forEach((node) => {
      const name = node.dataset.field;
      const message = errors[name] ? t(errors[name]) : "";
      node.classList.toggle("has-error", Boolean(message));
      const slot = node.querySelector(`#e-${name}`);
      if (slot) slot.textContent = message;
      const input = node.querySelector(".c-input");
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    });
    const first = Object.keys(errors)[0];
    if (first) {
      const target = form.querySelector(`[name="${first}"]`);
      target?.focus({ preventScroll: true });
      target?.closest("[data-field]")?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  };

  const go = (index) => {
    step = Math.max(0, Math.min(STEPS.length - 1, index));
    reached = Math.max(reached, step);
    render(true);
  };

  // ── Sending ─────────────────────────────────────────────────────────────
  const status = (message) => {
    const slot = form.querySelector("[data-status]");
    if (slot) slot.textContent = t(message);
  };

  const subjectLine = () => {
    const services = labelFor("services", state.services || []);
    const summary = (state.summary || "").trim();
    const subject = `${t(TEXT.subject)} ${ref} — ${services}${summary ? ` — ${summary}` : ""}`;
    return subject.length > 140 ? `${subject.slice(0, 137)}…` : subject;
  };

  const sendEmail = async () => {
    const full = briefText();
    const limit = 1900;
    const base = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subjectLine())}&body=`;
    let body = full;
    if ((base + encodeURIComponent(body)).length > limit) {
      // Long briefs (Chinese text encodes to ~9 URL characters per glyph) are cut to a
      // length every mail client accepts; the complete text goes to the clipboard.
      await copyText(full);
      const chars = Array.from(full);
      const tail = `…\n\n${t(TEXT.mailCut)}`;
      const fits = (count) => (base + encodeURIComponent(chars.slice(0, count).join("") + tail)).length <= limit;
      let low = 0;
      let high = chars.length;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (fits(mid)) low = mid; else high = mid - 1;
      }
      body = chars.slice(0, low).join("").replace(/\s+$/, "") + tail;
    }
    status(TEXT.statusEmail);
    // If no mail app takes the mailto link, the page keeps focus; then point to the copy route.
    let left = false;
    const onLeave = () => { left = true; };
    window.addEventListener("blur", onLeave, { once: true });
    document.addEventListener("visibilitychange", onLeave, { once: true });
    window.location.href = base + encodeURIComponent(body);
    window.setTimeout(() => {
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onLeave);
      if (!left && document.hasFocus()) {
        status(TEXT.statusNoMail());
        form.querySelector('[data-action="copy"]')?.focus();
      }
    }, 1600);
  };

  const sendEndpoint = async (button) => {
    if (filled(honey)) { sent = true; status(TEXT.statusSent(ref)); return; }
    button.disabled = true;
    const payload = {
      ...CONFIG.endpointFields,
      reference: ref,
      language: lang,
      name: state.name || "",
      email: state.email || "",
      wechat: state.wechat || "",
      phone: state.phone || "",
      services: labelFor("services", state.services || []),
      summary: state.summary || "",
      brief: briefText(),
      _subject: subjectLine(),
      subject: subjectLine(),
      _replyto: state.email || undefined
    };
    try {
      const response = await fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(String(response.status));
      sent = true;
      status(TEXT.statusSent(ref));
    } catch (error) {
      button.disabled = false;
      status(TEXT.statusFailed);
    }
  };

  // ── Events ──────────────────────────────────────────────────────────────
  const readInput = (input) => {
    const { name } = input;
    if (name === "website") { honey = input.value; return; }
    if (!name) return;
    if (input.type === "checkbox" && F[name]?.type === "many") {
      state[name] = [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((node) => node.value);
    } else if (input.type === "checkbox") {
      state[name] = input.checked;
      const dateInput = form.querySelector('input[name="date"]');
      if (name === "dateOpen" && dateInput) {
        dateInput.disabled = input.checked;
        if (input.checked) { dateInput.value = ""; state.date = ""; }
      }
    } else {
      state[name] = input.value;
    }
    if (name === "city" && !state.currencyManual) {
      const fieldset = form.querySelector('[data-field="budget"]');
      if (fieldset && (BUDGETS[currency()].every((item) => item.value !== state.budget))) {
        if (state.budget !== "unsure") state.budget = "";
        fieldset.replaceWith(renderField("budget"));
      }
    }
    const node = input.closest("[data-field]");
    if (node && node.classList.contains("has-error")) {
      node.classList.remove("has-error");
      const slot = node.querySelector(".c-error");
      if (slot) slot.textContent = "";
    }
    sent = false;
    save();
    refreshVisibility();
    updatePreview();
  };

  form.addEventListener("input", (event) => { if (event.target.matches("input, textarea")) readInput(event.target); });
  form.addEventListener("change", (event) => { if (event.target.matches("input[type=radio], input[type=checkbox]")) readInput(event.target); });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (STEPS[step] === "review") return;
    const errors = validate(step);
    if (Object.keys(errors).length) { showErrors(errors); return; }
    go(step + 1);
  });

  form.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target) return;

    if (target.dataset.currency) {
      state.currency = target.dataset.currency;
      state.currencyManual = true;
      if (state.budget && state.budget !== "unsure") state.budget = "";
      save();
      form.querySelector('[data-field="budget"]').replaceWith(renderField("budget"));
      form.querySelector(`[data-currency="${state.currency}"]`)?.focus();
      updatePreview();
      return;
    }

    if (target.hasAttribute("data-back")) { go(step - 1); return; }

    if (target.dataset.goto != null) {
      const index = Number(target.dataset.goto);
      if (index === step || index > reached) return;
      if (index > step) {
        for (let i = step; i < index; i += 1) {
          const errors = validate(i);
          if (Object.keys(errors).length) { if (i !== step) go(i); showErrors(errors); return; }
        }
      }
      go(index);
      return;
    }

    const action = target.dataset.action;
    if (action === "copy") {
      const ok = await copyText(briefText());
      if (ok) status(TEXT.statusCopied);
    } else if (action === "email") {
      await sendEmail();
    } else if (action === "send") {
      await sendEndpoint(target);
    } else if (action === "restart") {
      state = {};
      ref = makeRef();
      sent = false;
      reached = 0;
      try { localStorage.removeItem(STORE_KEY); } catch (error) { /* ignore */ }
      go(0);
    }
  });

  // Service tiles: pre-select the service and jump to the first step.
  document.querySelectorAll("[data-service]").forEach((link) => {
    link.addEventListener("click", () => {
      addService(link.dataset.service);
      save();
      step = 0;
      render(false);
    });
  });

  // ── Language ────────────────────────────────────────────────────────────
  const setLang = (next) => {
    lang = next;
    html.classList.toggle("is-zh", lang === "zh");
    html.lang = lang === "zh" ? "zh-Hans" : "en";
    document.title = t(TEXT.title);
    try { localStorage.setItem("zzLang", lang); } catch (error) { /* ignore */ }
    render(false);
  };

  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    button.addEventListener("click", () => setLang(lang === "zh" ? "en" : "zh"));
  });

  document.title = t(TEXT.title);
  render(false);
})();
