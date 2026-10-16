
"use strict";

// ========================================
// STUDY BLOOM — TASKS AND PRODUCTIVITY
// ========================================

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskProgress = document.getElementById("task-progress");
const overallProgress = document.getElementById("overall-progress");
const progressFill = document.getElementById("progress-fill");
const taskTotal = document.getElementById("task-total");
const emptyMessage = document.getElementById("empty-message");

const studyTimeDisplay = document.getElementById("study-time");
const currentDateDisplay = document.getElementById("current-date");

const timerDisplay = document.getElementById("timer-display");
const timerStatus = document.getElementById("timer-status");
const timerRing = document.getElementById("timer-ring");

const startTimerButton = document.getElementById("start-timer");
const pauseTimerButton = document.getElementById("pause-timer");
const resetTimerButton = document.getElementById("reset-timer");

const STORAGE_KEY = "studentDashboardTasks";
const SESSION_LENGTH = 25 * 60;

// ========================================
// LOAD SAVED TASKS
// ========================================

let tasks = [];

try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData !== null) {
        const parsedData = JSON.parse(savedData);

        if (Array.isArray(parsedData)) {
            tasks = parsedData.filter(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.text === "string" &&
                typeof task.completed === "boolean"
            );
        }
    }
} catch (error) {
    console.error("Unable to load saved tasks:", error);
}

// ========================================
// SAVE TASKS
// ========================================

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Unable to save tasks:", error);

        alert(
            "Your browser could not save the latest changes. " +
            "Check your browser storage settings."
        );

        return false;
    }
}

// ========================================
// TASK STATISTICS
// ========================================

function updateTaskStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    taskProgress.textContent = `${completed} / ${total}`;
    overallProgress.textContent = `${percentage}%`;

    progressFill.style.width = `${percentage}%`;

    taskTotal.textContent =
        `${total} ${total === 1 ? "task" : "tasks"}`;

    emptyMessage.hidden = total !== 0;
}

// ========================================
// RENDER TASKS
// ========================================

function renderTasks() {
    taskList.replaceChildren();

    tasks.forEach(task => {
        const item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = "task-toggle";

        toggleButton.textContent = task.completed ? "✓" : "";

        toggleButton.setAttribute(
            "aria-label",
            task.completed
                ? `Mark ${task.text} incomplete`
                : `Complete ${task.text}`
        );

        toggleButton.setAttribute(
            "aria-pressed",
            String(task.completed)
        );

        toggleButton.addEventListener("click", () => {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        });

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-task";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

        deleteButton.addEventListener("click", () => {
            const previousTasks = tasks;

            tasks = tasks.filter(
                existingTask => existingTask.id !== task.id
            );

            if (!saveTasks()) {
                tasks = previousTasks;
            }

            renderTasks();
        });

        item.append(toggleButton, text, deleteButton);
        taskList.appendChild(item);
    });

    updateTaskStatistics();
}

// ========================================
// ADD TASKS
// ========================================

function createTaskId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        taskInput.focus();
        return;
    }

    if (text.length > 200) {
        alert("Please keep your task under 200 characters.");
        return;
    }

    const newTask = {
        id: createTaskId(),
        text,
        completed: false
    };

    tasks.push(newTask);

    if (!saveTasks()) {
        tasks.pop();
        return;
    }

    renderTasks();

    taskInput.value = "";
    taskInput.focus();
});

// ========================================
// CURRENT DATE
// ========================================

function updateCurrentDate() {
    const now = new Date();

    currentDateDisplay.textContent = now.toLocaleDateString(
        undefined,
        {
            weekday: "short",
            month: "short",
            day: "numeric"
        }
    );
}

// ========================================
// STUDY TIMER
// ========================================

let timeLeft = SESSION_LENGTH;
let timerInterval = null;
let studySeconds = 0;
let lastTimerTick = null;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        `${String(minutes).padStart(2, "0")}:` +
        `${String(remainingSeconds).padStart(2, "0")}`
    );
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
}

function updateStudyTimeDisplay() {
    const minutes = Math.floor(studySeconds / 60);
    const seconds = studySeconds % 60;

    studyTimeDisplay.textContent = seconds === 0
        ? `${minutes} ${minutes === 1 ? "min" : "min"}`
        : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function stopTimerInterval() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    lastTimerTick = null;
    timerRing.classList.remove("is-running");
}

function startTimer() {
    if (timerInterval !== null || timeLeft <= 0) {
        return;
    }

    timerStatus.textContent = "you're doing great!";
    startTimerButton.disabled = true;
    pauseTimerButton.disabled = false;

    lastTimerTick = Date.now();
    timerRing.classList.add("is-running");

    timerInterval = setInterval(() => {
        const now = Date.now();

        // Use elapsed time so the countdown remains
        // more accurate if the browser is busy.
        const elapsed = Math.floor(
            (now - lastTimerTick) / 1000
        );

        if (elapsed < 1) {
            return;
        }

        lastTimerTick += elapsed * 1000;

        const actualElapsed = Math.min(elapsed, timeLeft);

        timeLeft -= actualElapsed;
        studySeconds += actualElapsed;

        updateTimerDisplay();
        updateStudyTimeDisplay();

        if (timeLeft <= 0) {
            stopTimerInterval();

            timeLeft = 0;
            updateTimerDisplay();

            timerStatus.textContent = "session complete!";
            startTimerButton.disabled = true;
            pauseTimerButton.disabled = true;

            alert("Beautiful work! Your focus session is complete. 🌸");
        }
    }, 250);
}

function pauseTimer() {
    if (timerInterval === null) {
        return;
    }

    stopTimerInterval();

    timerStatus.textContent = "paused — take a breath";
    startTimerButton.disabled = false;
    pauseTimerButton.disabled = true;
}

function resetTimer() {
    stopTimerInterval();

    timeLeft = SESSION_LENGTH;

    updateTimerDisplay();

    timerStatus.textContent = "ready when you are";
    startTimerButton.disabled = false;
    pauseTimerButton.disabled = true;
}

startTimerButton.addEventListener("click", startTimer);
pauseTimerButton.addEventListener("click", pauseTimer);
resetTimerButton.addEventListener("click", resetTimer);

// ========================================
// INITIALIZE THE APP
// ========================================

updateCurrentDate();
renderTasks();
updateTimerDisplay();
updateStudyTimeDisplay();

pauseTimerButton.disabled = true;
