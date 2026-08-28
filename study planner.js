document.addEventListener("DOMContentLoaded", () => {
    // State management variables
    let tasks = JSON.parse(localStorage.getItem("study_planner_tasks")) || [];
    let currentFilter = "all";
    let isReadingMode = false;

    // DOM Element References
    const nameSection = document.getElementById("name-section");
    const mainDashboard = document.getElementById("main-dashboard");
    const usernameInput = document.getElementById("username-input");
    const saveNameBtn = document.getElementById("save-name-btn");
    const nameError = document.getElementById("name-error");
    const welcomeMessage = document.getElementById("welcome-message");

    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    const taskForm = document.getElementById("task-form");
    const taskTitleInput = document.getElementById("task-title");
    const taskSubjectInput = document.getElementById("task-subject");
    const editTaskIdInput = document.getElementById("edit-task-id");
    const saveTaskBtn = document.getElementById("save-task-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const formTitle = document.getElementById("form-title");
    const taskError = document.getElementById("task-error");
    
    const taskList = document.getElementById("task-list");
    const noTasksMsg = document.getElementById("no-tasks-msg");
    const filterBtns = document.querySelectorAll(".filter-btn");

    const toggleReadingBtn = document.getElementById("toggle-reading-btn");
    const paragraphCountBadge = document.getElementById("paragraph-count-badge");

    // Init Application
    init();

    function init() {
        setupUser();
        renderTasks();
        countAndDisplayParagraphs();
        registerEventListeners();
    }

    // 1. Student Welcome Handling
    function setupUser() {
        const savedName = localStorage.getItem("study_planner_user");
        if (savedName) {
            welcomeMessage.textContent = `Welcome, ${savedName}!`;
            nameSection.classList.add("hidden");
            mainDashboard.classList.remove("hidden");
        }
    }

    saveNameBtn.addEventListener("click", () => {
        const nameValue = usernameInput.value.trim();
        if (nameValue === "") {
            nameError.textContent = "Please enter your name before continuing.";
            return;
        }
        nameError.textContent = "";
        localStorage.setItem("study_planner_user", nameValue);
        welcomeMessage.textContent = `Welcome, ${nameValue}!`;
        usernameInput.value = "";
        
        nameSection.classList.add("hidden");
        mainDashboard.classList.remove("hidden");
    });

    // 2. Tab Navigation
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
        });
    });

    // 3. Task Management (Add / Edit / Delete / Toggle Status)
    taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = taskTitleInput.value.trim();
        const subject = taskSubjectInput.value.trim();
        const editId = editTaskIdInput.value;

        if (!title || !subject) {
            taskError.textContent = "Please fill in both the task title and subject.";
            return;
        }
        taskError.textContent = "";

        if (editId) {
            // Edit existing task
            tasks = tasks.map(task => task.id == editId ? { ...task, title, subject } : task);
            resetForm();
        } else {
            // Create new task
            const newTask = {
                id: Date.now(),
                title,
                subject,
                status: "pending"
            };
            tasks.push(newTask);
        }

        saveAndRender();
        taskTitleInput.value = "";
        taskSubjectInput.value = "";
    });

    function resetForm() {
        editTaskIdInput.value = "";
        formTitle.textContent = "Add New Task";
        saveTaskBtn.textContent = "Add Task";
        cancelEditBtn.classList.add("hidden");
        taskTitleInput.value = "";
        taskSubjectInput.value = "";
    }

    cancelEditBtn.addEventListener("click", resetForm);

    function saveAndRender() {
        localStorage.setItem("study_planner_tasks", JSON.stringify(tasks));
        renderTasks();
    }

    function renderTasks() {
        taskList.innerHTML = "";
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === "pending") return task.status === "pending";
            if (currentFilter === "completed") return task.status === "completed";
            return true;
        });

        if (filteredTasks.length === 0) {
            noTasksMsg.classList.remove("hidden");
        } else {
            noTasksMsg.classList.add("hidden");
        }

        filteredTasks.forEach(task => {
            const li = document.createElement("li");
            li.className = `task-item ${task.status === "completed" ? "completed" : ""}`;

            li.innerHTML = `
                <div class="task-info">
                    <span class="task-title">${escapeHTML(task.title)}</span>
                    <span class="task-subject">${escapeHTML(task.subject)} (${task.status})</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-secondary toggle-btn">${task.status === "pending" ? "Mark Complete" : "Mark Pending"}</button>
                    <button class="btn btn-sm btn-primary edit-btn">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                </div>
            `;

            // Dynamic Action Button Listeners
            li.querySelector(".toggle-btn").addEventListener("click", () => toggleTaskStatus(task.id));
            li.querySelector(".edit-btn").addEventListener("click", () => prepareEdit(task));
            li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

            taskList.appendChild(li);
        });
    }

    function toggleTaskStatus(id) {
        tasks = tasks.map(t => t.id === id ? { ...t, status: t.status === "pending" ? "completed" : "pending" } : t);
        saveAndRender();
    }

    function prepareEdit(task) {
        editTaskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskSubjectInput.value = task.subject;
        formTitle.textContent = "Edit Task";
        saveTaskBtn.textContent = "Save Changes";
        cancelEditBtn.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        if (editTaskIdInput.value == id) {
            resetForm();
        }
        saveAndRender();
    }

    // 4. Filtering Tasks
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // 5. Paragraph Counter & Reading Mode
    function countAndDisplayParagraphs() {
        const paragraphs = document.querySelectorAll("p");
        const count = paragraphs.length;
        paragraphCountBadge.textContent = `Paragraphs: ${count}`;
        console.log(`Total Paragraphs on Page: ${count}`);
    }

    toggleReadingBtn.addEventListener("click", () => {
        isReadingMode = !isReadingMode;
        document.body.classList.toggle("reading-mode", isReadingMode);
        toggleReadingBtn.textContent = isReadingMode ? "Disable Reading Mode" : "Toggle Reading Mode";
    });

    function registerEventListeners() {}

    // Security Helper to prevent HTML Injection
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
});