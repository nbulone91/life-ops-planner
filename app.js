const STORAGE_KEY = "life-ops-planner-state-v1";

const state = loadStoredState({
  view: "overview",
  mealMode: "dinner",
  activeMealId: "tomato-bowls",
  selectedMonth: "Apr",
  writerTone: "Warm",
  draftCopied: false,
  groceries: [
    { id: "g1", name: "Chickpeas", qty: "2 cans", done: false },
    { id: "g2", name: "Cherry tomatoes", qty: "1 pint", done: false },
    { id: "g3", name: "Greek yogurt", qty: "1 tub", done: true },
    { id: "g4", name: "Fresh herbs", qty: "1 bunch", done: false },
  ],
  recipes: [
    {
      id: "tomato-bowls",
      name: "Roasted Tomato Chickpea Bowls",
      cost: 14,
      time: 35,
      accent: "#c95b45",
      tags: ["Dinner", "Batch friendly", "$3.50/serving"],
      ingredients: ["Chickpeas", "Cherry tomatoes", "Greek yogurt", "Fresh herbs", "Lemon", "Farro"],
      note: "High-protein pantry dinner with bright herbs and a creamy lemon finish.",
    },
    {
      id: "miso-salmon",
      name: "Miso Salmon Rice Plates",
      cost: 22,
      time: 28,
      accent: "#2f6075",
      tags: ["Dinner", "Fast", "$5.50/serving"],
      ingredients: ["Salmon", "Miso paste", "Rice", "Cucumber", "Scallions"],
      note: "A clean weeknight plate with crisp vegetables and a savory glaze.",
    },
    {
      id: "lentil-soup",
      name: "Lemony Lentil Soup",
      cost: 11,
      time: 42,
      accent: "#6f927b",
      tags: ["Lunch", "Freezer", "$2.75/serving"],
      ingredients: ["Lentils", "Carrots", "Celery", "Spinach", "Lemon"],
      note: "Low-cost batch soup that holds up well for weekday lunches.",
    },
  ],
  meals: [
    { id: "m1", day: "Mon", date: "27", recipeId: "tomato-bowls", type: "dinner" },
    { id: "m2", day: "Tue", date: "28", recipeId: "miso-salmon", type: "dinner" },
    { id: "m3", day: "Wed", date: "29", recipeId: "lentil-soup", type: "lunch" },
    { id: "m4", day: "Thu", date: "30", recipeId: "tomato-bowls", type: "dinner" },
    { id: "m5", day: "Fri", date: "1", recipeId: "miso-salmon", type: "dinner" },
    { id: "m6", day: "Sat", date: "2", recipeId: "lentil-soup", type: "lunch" },
    { id: "m7", day: "Sun", date: "3", recipeId: "tomato-bowls", type: "dinner" },
  ],
  budget: [
    { month: "Nov", spend: 2830, income: 4320, color: "#6f927b" },
    { month: "Dec", spend: 3180, income: 4360, color: "#d7a948" },
    { month: "Jan", spend: 2940, income: 4380, color: "#2f6075" },
    { month: "Feb", spend: 2680, income: 4380, color: "#6f927b" },
    { month: "Mar", spend: 3375, income: 4420, color: "#c95b45" },
    { month: "Apr", spend: 2510, income: 4420, color: "#2f6075" },
  ],
  categories: [
    { name: "Groceries", spent: 458, limit: 620, color: "#6f927b" },
    { name: "Dining", spent: 186, limit: 260, color: "#c95b45" },
    { name: "Bills", spent: 1120, limit: 1260, color: "#2f6075" },
    { name: "Flex", spent: 288, limit: 450, color: "#d7a948" },
  ],
});

const icons = {
  overview: '<svg viewBox="0 0 24 24"><path d="M4 13h7V4H4z"/><path d="M13 20h7V4h-7z"/><path d="M4 20h7v-5H4z"/></svg>',
  budget: '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-7"/></svg>',
  meals: '<svg viewBox="0 0 24 24"><path d="M4 5h16v15H4z"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M4 10h16"/></svg>',
  recipes: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>',
  writer: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="7"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><path d="M8 8h11v11H8z"/><path d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.1L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
};

const app = document.querySelector("#app");

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function recipeById(id) {
  return state.recipes.find((recipe) => recipe.id === id) || state.recipes[0];
}

function selectedBudget() {
  return state.budget.find((item) => item.month === state.selectedMonth) || state.budget.at(-1);
}

function render() {
  persistState();
  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <main class="workspace">
        ${renderTopbar()}
        ${renderOverview()}
        ${renderBudget()}
        ${renderMeals()}
        ${renderRecipes()}
        ${renderWriter()}
      </main>
      <div class="toast" id="toast"></div>
    </div>
  `;
  bindEvents();
}

function loadStoredState(defaultState) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return defaultState;
    return { ...defaultState, ...saved };
  } catch {
    return defaultState;
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The app still works as a demo if browser storage is unavailable.
  }
}

function renderSidebar() {
  const items = [
    ["overview", "Overview", "4"],
    ["budget", "Budget", "$"],
    ["meals", "Meals", "7"],
    ["recipes", "Recipes", String(state.recipes.length)],
    ["writer", "Writer", "AI"],
  ];

  return `
    <aside class="sidebar">
      <div class="brand">
        <img src="assets/life-ops-mark.png" alt="Life Ops Planner mark" />
        <div class="brand-title">
          <strong>Life Ops Planner</strong>
          <span>Budget, meals, drafts</span>
        </div>
      </div>
      <nav class="nav-group" aria-label="Primary">
        ${items
          .map(
            ([id, label, count]) => `
              <button class="nav-button ${state.view === id ? "active" : ""}" data-view="${id}" title="${label}">
                ${icons[id]}
                <span>${label}</span>
                <span class="nav-count">${count}</span>
              </button>
            `,
          )
          .join("")}
      </nav>
      <div class="sidebar-bottom">
        <span class="section-label">Month health</span>
        <strong>${money(selectedBudget().income - selectedBudget().spend)} left</strong>
        <div class="meter" style="--value: ${Math.round((selectedBudget().spend / selectedBudget().income) * 100)}%">
          <span></span>
        </div>
        <span class="micro">${state.groceries.filter((item) => !item.done).length} grocery items open</span>
      </div>
    </aside>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <label class="search" aria-label="Search">
        ${icons.search}
        <input id="globalSearch" type="search" placeholder="Search recipes, budget notes, or drafts" />
      </label>
      <button class="date-pill" data-view="meals">${icons.meals}<span>Apr 27 - May 3</span></button>
      <button class="profile-pill" data-view="writer"><span class="profile-dot">N</span><span>Draft mode</span></button>
    </header>
  `;
}

function renderOverview() {
  return `
    <section class="view ${state.view === "overview" ? "active" : ""}" id="overview">
      ${renderHeader("Weekly Command Center", "One calm place to plan food, watch spending, and turn scattered thoughts into useful words.", [
        ["Plan meal", "meals"],
        ["Write update", "writer"],
      ])}
      <div class="dashboard-grid">
        <div class="main-stack">
          ${renderMealPanel()}
          ${renderBudgetPanel()}
          ${renderWriterPanel()}
        </div>
        <div class="side-stack">
          ${renderRecipeDetail()}
          ${renderGroceryPanel()}
        </div>
      </div>
    </section>
  `;
}

function renderBudget() {
  return `
    <section class="view ${state.view === "budget" ? "active" : ""}" id="budget">
      ${renderHeader("Budget Tracker", "Compare month-to-month spending, inspect categories, and keep grocery decisions tied to the plan.", [
        ["Generate summary", "writer"],
      ])}
      <div class="dashboard-grid">
        <div class="main-stack">
          ${renderBudgetPanel()}
          <section class="panel list-panel">
            <span class="section-label">Category plan</span>
            <h2>Spending lanes</h2>
            <div class="category-list">${renderCategories()}</div>
          </section>
        </div>
        <div class="side-stack">
          ${renderGroceryPanel()}
          ${renderTaskPanel()}
        </div>
      </div>
    </section>
  `;
}

function renderMeals() {
  return `
    <section class="view ${state.view === "meals" ? "active" : ""}" id="meals">
      ${renderHeader("Meal Planner", "Build a weekly menu, turn recipes into groceries, and see the cost before you shop.", [
        ["Add grocery", "groceries"],
      ])}
      <div class="dashboard-grid">
        <div class="main-stack">${renderMealPanel()}${renderGroceryPanel()}</div>
        <div class="side-stack">${renderRecipeDetail()}</div>
      </div>
    </section>
  `;
}

function renderRecipes() {
  return `
    <section class="view ${state.view === "recipes" ? "active" : ""}" id="recipes">
      ${renderHeader("Recipe Planner", "Save practical meals with cost, time, and grocery details that make the week easier.", [
        ["Use in week", "meals"],
      ])}
      <div class="dashboard-grid">
        <div class="main-stack">
          <section class="panel list-panel">
            <span class="section-label">Saved recipes</span>
            <h2>Kitchen shortlist</h2>
            <div class="quick-entry">
              <input class="quick-input" id="recipeInput" placeholder="Add a simple recipe name" />
              <button class="primary-button" id="addRecipe">${icons.plus}<span>Add</span></button>
            </div>
            <div class="recipe-list">${renderRecipeRows()}</div>
          </section>
        </div>
        <div class="side-stack">${renderRecipeDetail()}${renderWriterPanel()}</div>
      </div>
    </section>
  `;
}

function renderWriter() {
  return `
    <section class="view ${state.view === "writer" ? "active" : ""}" id="writer">
      ${renderHeader("AI Writing Assistant", "Draft budget recaps, meal notes, grocery messages, and tidy updates in your own voice.", [
        ["Use budget context", "budget"],
      ])}
      <div class="dashboard-grid">
        <div class="main-stack">${renderWriterPanel()}</div>
        <div class="side-stack">${renderTaskPanel()}${renderRecipeDetail()}</div>
      </div>
    </section>
  `;
}

function renderHeader(title, subtitle, actions) {
  return `
    <div class="view-header">
      <div>
        <p class="kicker">Local first planner</p>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="hero-actions">
        ${actions
          .map(([label, target]) => `<button class="${target === "groceries" ? "ghost-button" : "primary-button"}" data-action="${target}">${target === "writer" ? icons.spark : icons.plus}<span>${label}</span></button>`)
          .join("")}
      </div>
    </div>
  `;
}

function renderMealPanel() {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="section-label">Meal plan</span>
          <h2>Apr 27 - May 3</h2>
        </div>
        <div class="segmented" role="tablist" aria-label="Meal type">
          ${["dinner", "lunch", "all"].map((mode) => `<button class="seg-button ${state.mealMode === mode ? "active" : ""}" data-meal-mode="${mode}">${mode}</button>`).join("")}
        </div>
      </div>
      <div class="meal-grid">
        ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          .map((day) => {
            const meals = state.meals.filter((meal) => meal.day === day && (state.mealMode === "all" || meal.type === state.mealMode));
            const date = state.meals.find((meal) => meal.day === day)?.date || "";
            return `
              <div class="day-column">
                <div class="day-head">
                  <div class="day-name">${day}</div>
                  <div class="day-date">Apr ${date}</div>
                </div>
                <div class="meal-slot">
                  ${
                    meals.length
                      ? meals
                          .map((meal) => {
                            const recipe = recipeById(meal.recipeId);
                            return `<button class="meal-pill ${state.activeMealId === recipe.id ? "active" : ""}" style="--accent:${recipe.accent}" data-recipe="${recipe.id}"><strong>${recipe.name}</strong><span>${money(recipe.cost)} planned</span></button>`;
                          })
                          .join("")
                      : '<div class="empty-state">Open slot</div>'
                  }
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderBudgetPanel() {
  const maxSpend = Math.max(...state.budget.map((item) => item.spend));
  const selected = selectedBudget();
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="section-label">Budget</span>
          <h2>${state.selectedMonth} cash flow</h2>
        </div>
        <button class="ghost-button" data-action="writer">${icons.spark}<span>Recap</span></button>
      </div>
      <div class="budget-layout">
        <div class="chart" aria-label="Monthly spending chart">
          <div class="axis"><span>$4k</span><span>$2k</span><span>$0</span></div>
          ${state.budget
            .map(
              (item) => `
                <button class="bar-wrap" data-month="${item.month}" aria-label="${item.month} spending ${money(item.spend)}">
                  <span class="bar ${state.selectedMonth === item.month ? "active" : ""}" style="--height:${Math.round((item.spend / maxSpend) * 92)}%;--color:${item.color}"><span></span></span>
                  <span class="bar-label">${item.month}</span>
                </button>
              `,
            )
            .join("")}
        </div>
        <aside class="budget-insight">
          <div class="stat">
            <span class="section-label">Left after spend</span>
            <strong>${money(selected.income - selected.spend)}</strong>
            <span class="micro">${Math.round((selected.spend / selected.income) * 100)}% of income spent</span>
          </div>
          <div class="category-list">${renderCategories()}</div>
        </aside>
      </div>
    </section>
  `;
}

function renderCategories() {
  return state.categories
    .map(
      (category) => `
        <div class="category-row" style="--bar-color:${category.color}">
          <strong>${category.name}</strong>
          <span>${money(category.spent)} / ${money(category.limit)}</span>
          <progress value="${category.spent}" max="${category.limit}"></progress>
        </div>
      `,
    )
    .join("");
}

function renderRecipeDetail() {
  const recipe = recipeById(state.activeMealId);
  return `
    <section class="panel recipe-detail">
      <img class="recipe-photo" src="assets/recipe-bowl.png" alt="Roasted tomato chickpea bowl" />
      <div class="recipe-body">
        <div>
          <span class="section-label">Selected recipe</span>
          <h2>${recipe.name}</h2>
          <p class="micro">${recipe.note}</p>
        </div>
        <div class="detail-meta">
          ${recipe.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          <span class="tag">${recipe.time} min</span>
          <span class="tag">${money(recipe.cost)}</span>
        </div>
        <button class="primary-button" data-add-ingredients="${recipe.id}">${icons.plus}<span>Add ingredients</span></button>
      </div>
    </section>
  `;
}

function renderGroceryPanel() {
  const total = state.groceries.length;
  const done = state.groceries.filter((item) => item.done).length;
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="section-label">Grocery list</span>
          <h2>${done}/${total} checked</h2>
        </div>
        <button class="icon-button" title="Add grocery" data-action="groceries">${icons.plus}</button>
      </div>
      <div class="list-panel">
        <div class="quick-entry">
          <input class="quick-input" id="groceryInput" placeholder="Add grocery item" />
          <button class="ghost-button" id="addGrocery">${icons.plus}<span>Add</span></button>
        </div>
        <div class="grocery-list" style="margin-top:12px">
          ${state.groceries
            .map(
              (item) => `
                <label class="grocery-row ${item.done ? "done" : ""}">
                  <input type="checkbox" data-grocery="${item.id}" ${item.done ? "checked" : ""} />
                  <span>${item.name}</span>
                  <small>${item.qty}</small>
                </label>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderRecipeRows() {
  return state.recipes
    .map(
      (recipe) => `
        <button class="recipe-row ${state.activeMealId === recipe.id ? "active" : ""}" data-recipe="${recipe.id}">
          <span><strong>${recipe.name}</strong><br /><small>${recipe.time} min / ${money(recipe.cost)}</small></span>
          <span class="tag">${recipe.tags[0]}</span>
        </button>
      `,
    )
    .join("");
}

function renderWriterPanel() {
  const prompt = "Write a short weekly update that mentions the grocery list, the meal plan, and the current budget position.";
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="section-label">Writer</span>
          <h2>Draft assistant</h2>
        </div>
        <div class="chips" aria-label="Tone">
          ${["Warm", "Brief", "Polished"].map((tone) => `<button class="chip ${state.writerTone === tone ? "active" : ""}" data-tone="${tone}">${tone}</button>`).join("")}
        </div>
      </div>
      <div class="composer">
        <textarea id="writerPrompt">${prompt}</textarea>
        <div class="composer-toolbar">
          <button class="primary-button" id="generateDraft">${icons.spark}<span>Generate draft</span></button>
          <button class="ghost-button" id="copyDraft">${icons.copy}<span>${state.draftCopied ? "Copied" : "Copy"}</span></button>
        </div>
        <div class="draft-output" id="draftOutput">${buildDraft()}</div>
      </div>
    </section>
  `;
}

function renderTaskPanel() {
  return `
    <section class="panel list-panel">
      <span class="section-label">Next actions</span>
      <h2>Today</h2>
      <div class="task-list">
        <div class="task-row"><strong>Review dining category</strong><span class="micro">Dining is tracking at 72% of the monthly cap.</span></div>
        <div class="task-row"><strong>Batch lunch prep</strong><span class="micro">Lemony lentil soup covers 3 lunches.</span></div>
        <div class="task-row"><strong>Send household note</strong><span class="micro">Use the writer recap after groceries are checked.</span></div>
      </div>
    </section>
  `;
}

function buildDraft(customPrompt = "") {
  const selected = selectedBudget();
  const remaining = selected.income - selected.spend;
  const openGroceries = state.groceries.filter((item) => !item.done).map((item) => item.name).slice(0, 3).join(", ");
  const recipe = recipeById(state.activeMealId);
  const intro = state.writerTone === "Brief" ? "Quick update:" : state.writerTone === "Polished" ? "Here is the weekly plan at a glance:" : "Here is the gentle weekly reset:";
  const context = customPrompt ? `\n\nPrompt focus: ${customPrompt.trim()}` : "";
  return `${intro}

Meals are anchored by ${recipe.name}, with ingredients ready to roll into the grocery list. The current ${state.selectedMonth} budget has ${money(remaining)} left after ${money(selected.spend)} in spending.

Open grocery priorities: ${openGroceries || "all set"}. I will keep the week simple, use what is already planned, and avoid extra dining spend unless something truly needs to move.${context}`;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (["budget", "meals", "recipes", "writer"].includes(action)) {
        state.view = action;
        render();
      }
      if (action === "groceries") {
        addGrocery("Seasonal fruit", "1 bag");
      }
    });
  });

  document.querySelectorAll("[data-meal-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mealMode = button.dataset.mealMode;
      render();
    });
  });

  document.querySelectorAll("[data-recipe]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeMealId = button.dataset.recipe;
      render();
    });
  });

  document.querySelectorAll("[data-month]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMonth = button.dataset.month;
      render();
    });
  });

  document.querySelectorAll("[data-grocery]").forEach((input) => {
    input.addEventListener("change", () => {
      const item = state.groceries.find((grocery) => grocery.id === input.dataset.grocery);
      item.done = input.checked;
      render();
    });
  });

  document.querySelectorAll("[data-tone]").forEach((button) => {
    button.addEventListener("click", () => {
      state.writerTone = button.dataset.tone;
      state.draftCopied = false;
      render();
    });
  });

  document.querySelectorAll("[data-add-ingredients]").forEach((button) => {
    button.addEventListener("click", () => {
      const recipe = recipeById(button.dataset.addIngredients);
      recipe.ingredients.forEach((ingredient) => {
        if (!state.groceries.some((item) => item.name === ingredient)) {
          addGrocery(ingredient, "1");
        }
      });
      showToast(`${recipe.name} ingredients added`);
    });
  });

  const addGroceryButton = document.querySelector("#addGrocery");
  const groceryInput = document.querySelector("#groceryInput");
  if (addGroceryButton && groceryInput) {
    addGroceryButton.addEventListener("click", () => {
      addGrocery(groceryInput.value || "Pantry staple", "1");
    });
    groceryInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addGrocery(groceryInput.value || "Pantry staple", "1");
    });
  }

  const addRecipeButton = document.querySelector("#addRecipe");
  const recipeInput = document.querySelector("#recipeInput");
  if (addRecipeButton && recipeInput) {
    addRecipeButton.addEventListener("click", () => addRecipe(recipeInput.value));
    recipeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addRecipe(recipeInput.value);
    });
  }

  const generateDraftButton = document.querySelector("#generateDraft");
  if (generateDraftButton) {
    generateDraftButton.addEventListener("click", () => {
      const prompt = document.querySelector("#writerPrompt")?.value || "";
      const output = document.querySelector("#draftOutput");
      if (output) output.textContent = buildDraft(prompt);
      state.draftCopied = false;
      showToast("Draft refreshed with current plan context");
    });
  }

  const copyDraftButton = document.querySelector("#copyDraft");
  if (copyDraftButton) {
    copyDraftButton.addEventListener("click", async () => {
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

  const search = document.querySelector("#globalSearch");
  if (search) {
    search.addEventListener("input", () => {
      const query = search.value.toLowerCase();
      const match = state.recipes.find((recipe) => recipe.name.toLowerCase().includes(query));
      if (match) {
        state.activeMealId = match.id;
        state.view = "recipes";
        render();
      }
    });
  }
}

function addGrocery(name, qty) {
  const cleanName = name.trim();
  if (!cleanName) return;
  state.groceries.unshift({ id: crypto.randomUUID(), name: cleanName, qty, done: false });
  showToast(`${cleanName} added to groceries`);
  render();
}

function addRecipe(name) {
  const cleanName = name.trim();
  if (!cleanName) return;
  const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || crypto.randomUUID();
  state.recipes.unshift({
    id,
    name: cleanName,
    cost: 16,
    time: 30,
    accent: "#6f927b",
    tags: ["Dinner", "New", "$4/serving"],
    ingredients: [cleanName.split(" ")[0], "Pantry staples"],
    note: "New recipe shell ready for ingredients, timing, and meal planning.",
  });
  state.activeMealId = id;
  showToast(`${cleanName} saved`);
  render();
}

function showToast(message) {
  requestAnimationFrame(() => {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1700);
  });
}

render();
