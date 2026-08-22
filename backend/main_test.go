package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
)

func setupTestApp() *fiber.App {
	initDB()
	app := fiber.New()

	api := app.Group("/api")
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy"})
	})
	api.Get("/metrics", handleGetMetrics)
	api.Get("/tasks", handleGetTasks)
	api.Get("/sections", handleGetSections)
	api.Get("/schedule", handleGetSchedule)
	api.Post("/tasks/submit", handleSubmitTask)
	api.Get("/tests/status", handleGetTestsStatus)

	return app
}

func TestHealthCheck(t *testing.T) {
	app := setupTestApp()
	req := httptest.NewRequest("GET", "/api/health", nil)
	resp, err := app.Test(req, 5000)
	if err != nil {
		t.Fatalf("Health check failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
}

func TestGetMetrics(t *testing.T) {
	app := setupTestApp()
	req := httptest.NewRequest("GET", "/api/metrics", nil)
	resp, err := app.Test(req, 5000)
	if err != nil {
		t.Fatalf("Metrics request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
}

func TestSubmitTaskSecurityRejections(t *testing.T) {
	app := setupTestApp()

	// 1. Invalid Department Injection Attempt
	badDeptPayload := SubmitTaskRequest{
		Department:       "HackingDept' OR '1'='1",
		TargetSection:    "SEC_BSB_LKO_01",
		TaskType:         "Rail Weld",
		Criticality:      "High",
		DurationMinutes:  90,
		DueDate:          "2026-08-25",
	}
	body, _ := json.Marshal(badDeptPayload)
	req := httptest.NewRequest("POST", "/api/tasks/submit", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req, 5000)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid department, got %d", resp.StatusCode)
	}

	// 2. Out-of-bounds duration (<15 or >720)
	badDurationPayload := SubmitTaskRequest{
		Department:       "Engineering",
		TargetSection:    "SEC_BSB_LKO_01",
		TaskType:         "Rail Weld",
		Criticality:      "High",
		DurationMinutes:  5, // Invalid duration
		DueDate:          "2026-08-25",
	}
	body, _ = json.Marshal(badDurationPayload)
	req = httptest.NewRequest("POST", "/api/tasks/submit", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ = app.Test(req, 5000)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("Expected status 400 for out-of-bounds duration, got %d", resp.StatusCode)
	}

	// 3. Valid Submission
	validPayload := SubmitTaskRequest{
		Department:       "Engineering",
		TargetSection:    "SEC_BSB_LKO_01",
		TaskType:         "Broken Rail Weld Repair",
		Criticality:      "High",
		DurationMinutes:  90,
		DueDate:          time.Now().AddDate(0, 0, 2).Format("2006-01-02"),
	}
	body, _ = json.Marshal(validPayload)
	req = httptest.NewRequest("POST", "/api/tasks/submit", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, _ = app.Test(req, 5000)
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("Expected status 201 for valid task submission, got %d", resp.StatusCode)
	}
}
