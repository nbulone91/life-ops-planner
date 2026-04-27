(function installLifeOpsUpgrade() {
  if (globalThis.lifeOpsUpgradeApplied || typeof state === "undefined") return;
  globalThis.lifeOpsUpgradeApplied = true;

  const API_KEY_STORAGE_KEY = "life-ops-openai-api-key-v1";
  state.aiModel = state.aiModel || "gpt-5";
  state.writerBusy = false;
  state.currentDraft = state.currentDraft || "";

  const baseBindEvents = bindEvents;

  renderTopbar = function renderUpgradedTopbar() {
    return `
      <header class="topbar">
        <label class="search" aria-label="Search">
          ${icons.search}
          <input id="globalSearch" type="search" placeholder="Search recipes, budget notes, or drafts" />
        </label>
        <button class="date-pill" data-view="meals">${icons.meals}<span>Apr 27 - May 3</span></button>
        <button class="status-pill" title="Changes are saved in this browser">${icons.check}<span>Saved</span></button>
        <button class="ghost-button topbar-action" id="exportData">Export</button>
        <button class="ghost-button topbar-action" id="importData">Import</button>
        <input id="importFile" type="file" accept="application/json" hidden />
        <button class="profile-pill" data-view="writer"><span class="profile-dot">N</span><span>Draft mode</span></button>
      </header>
    `;
  };

  renderWriterPanel = function renderUpgradedWriterPanel() {
    const prompt = "Write a short weekly update that mentions the grocery list, the meal plan, and the current budget position.";
    const hasApiKey = Boolean(getOpenAIKey());
    return `
      <section class="panel">
        <div class="panel-header">
          <div>
            <span class="section-label">Writer</span>
            <h2>${hasApiKey ? "AI draft assistant" : "Draft assistant"}</h2>
          </div>
          <div class="chips" aria-label="Tone">
            ${["Warm", "Brief", "Polished"].map((tone) => `<button class="chip ${state.writerTone === tone ? "active" : ""}" data-tone="${tone}">${tone}</button>`).join("")}
          </div>
        </div>
        <div class="composer">
          <textarea id="writerPrompt">${prompt}</textarea>
          <div class="composer-toolbar">
            <button class="primary-button" id="generateDraft" ${state.writerBusy ? "disabled" : ""}>${icons.spark}<span>${state.writerBusy ? "Writing..." : hasApiKey ? "Generate with AI" : "Generate draft"}</span></button>
            <button class="ghost-button" id="setApiKey">${icons.writer}<span>${hasApiKey ? "AI key set" : "Add AI key"}</span></button>
            <button class="ghost-button" id="copyDraft">${icons.copy}<span>${state.draftCopied ? "Copied" : "Copy"}</span></button>
          </div>
          <div class="draft-output" id="draftOutput">${state.currentDraft || buildDraft()}</div>
        </div>
      </section>
    `;
  };

  bindEvents = function bindUpgradedEvents() {
    baseBindEvents();

    const generateDraftButton = document.querySelector("#generateDraft");
    if (generateDraftButton) {
      const freshGenerate = generateDraftButton.cloneNode(true);
      generateDraftButton.replaceWith(freshGenerate);
      freshGenerate.addEventListener("click", async () => {
        const prompt = document.querySelector("#writerPrompt")?.value || "";
        if (getOpenAIKey()) {
          await generateAIDraft(prompt);
        } else {
          state.currentDraft = buildDraft(prompt);
          const output = document.querySelector("#draftOutput");
          if (output) output.textContent = state.currentDraft;
          state.draftCopied = false;
          showToast("Draft refreshed with local plan context");
        }
      });
    }

    const copyDraftButton = document.querySelector("#copyDraft");
    if (copyDraftButton) {
      const freshCopy = copyDraftButton.cloneNode(true);
      copyDraftButton.replaceWith(freshCopy);
      freshCopy.addEventListener("click", async () => {
        const output = document.querySelector("#draftOutput")?.textContent || "";
        try {
          await navigator.clipboard.writeText(output);
          state.draftCopied = true;
          showToast("Draft copied");
        } catch {
          showToast("Copy is unavailable in this browser");
        }
        render();
      });
    }

    document.querySelector("#setApiKey")?.addEventListener("click", setOpenAIKey);
    document.querySelector("#exportData")?.addEventListener("click", exportPlannerData);
    const importFile = document.querySelector("#importFile");
    document.querySelector("#importData")?.addEventListener("click", () => importFile?.click());
    importFile?.addEventListener("change", () => importPlannerData(importFile.files?.[0]));
  };

  function getOpenAIKey() {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  }

  function setOpenAIKey() {
    const current = getOpenAIKey();
    const next = prompt("Paste your OpenAI API key for this device. Leave blank to remove it.", current ? "sk-..." : "");
    if (next === null) return;
    const clean = next.trim();
    if (!clean || clean === "sk-...") {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      showToast("AI key removed from this device");
    } else {
      localStorage.setItem(API_KEY_STORAGE_KEY, clean);
      showToast("AI key saved on this device");
    }
    render();
  }

  function buildAIInput(customPrompt) {
    const selected = selectedBudget();
    const remaining = selected.income - selected.spend;
    const recipe = recipeById(state.activeMealId);
    const openGroceries = state.groceries.filter((item) => !item.done).map((item) => `${item.name} (${item.qty})`);
    const categorySummary = state.categories.map((category) => `${category.name}: ${money(category.spent)} of ${money(category.limit)}`).join("; ");

    return [
      `Tone: ${state.writerTone}`,
      `User request: ${customPrompt.trim() || "Write a useful weekly update."}`,
      `Selected recipe: ${recipe.name} (${money(recipe.cost)}, ${recipe.time} minutes).`,
      `Budget: ${state.selectedMonth} income ${money(selected.income)}, spending ${money(selected.spend)}, remaining ${money(remaining)}.`,
      `Categories: ${categorySummary}.`,
      `Open groceries: ${openGroceries.join(", ") || "none"}.`,
      "Write a concise, practical draft for a household planning update. Do not mention that you are an AI.",
    ].join("\n");
  }

  async function generateAIDraft(promptText) {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      setOpenAIKey();
      return;
    }

    state.writerBusy = true;
    render();

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: state.aiModel || "gpt-5",
          instructions: "You are the writing assistant inside Life Ops Planner. Be concise, concrete, and helpful.",
          input: buildAIInput(promptText),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI request failed");

      state.currentDraft = extractResponseText(data) || buildDraft(promptText);
      state.draftCopied = false;
      showToast("AI draft ready");
    } catch (error) {
      state.currentDraft = `${buildDraft(promptText)}\n\nAI request issue: ${error.message}`;
      showToast("AI request could not complete");
    } finally {
      state.writerBusy = false;
      render();
    }
  }

  function extractResponseText(data) {
    if (data.output_text) return data.output_text;
    return (data.output || [])
      .flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  function exportPlannerData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "Life Ops Planner",
      version: 1,
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `life-ops-planner-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Planner backup exported");
  }

  function importPlannerData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const incoming = payload.state || payload;
        Object.assign(state, incoming, { writerBusy: false, draftCopied: false });
        persistState();
        showToast("Planner backup imported");
        render();
      } catch {
        showToast("That backup file could not be read");
      }
    };
    reader.readAsText(file);
  }

  render();
})();
