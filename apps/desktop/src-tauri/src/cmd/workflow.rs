use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowRule {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub conditions: Vec<WorkflowCondition>,
    pub actions: Vec<WorkflowAction>,
    pub stop_on_failure: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowCondition {
    pub condition_type: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowAction {
    pub action_type: String,
    pub params: serde_json::Value,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowResult {
    pub rule_id: String,
    pub actions_executed: Vec<String>,
    pub errors: Vec<String>,
}

#[tauri::command]
pub fn list_workflow_rules(app_handle: AppHandle) -> Result<Vec<WorkflowRule>, String> {
    let store = app_handle.get_store("settings.json").ok_or("Store not found")?;
    let rules = store.get("workflow_rules").unwrap_or(serde_json::json!([]));
    let rules: Vec<WorkflowRule> = serde_json::from_value(rules).unwrap_or_default();
    Ok(rules)
}

#[tauri::command]
pub fn save_workflow_rule(app_handle: AppHandle, rule: WorkflowRule) -> Result<(), String> {
    let store = app_handle.get_store("settings.json").ok_or("Store not found")?;
    let mut rules: Vec<WorkflowRule> = store
        .get("workflow_rules")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    if let Some(pos) = rules.iter().position(|r| r.id == rule.id) {
        rules[pos] = rule;
    } else {
        rules.push(rule);
    }

    store.set("workflow_rules", serde_json::to_value(&rules).unwrap());
    store.save().map_err(|e| e.to_string())?;
    info!("Saved workflow rules: {} total", rules.len());
    Ok(())
}

#[tauri::command]
pub fn delete_workflow_rule(app_handle: AppHandle, rule_id: String) -> Result<(), String> {
    let store = app_handle.get_store("settings.json").ok_or("Store not found")?;
    let mut rules: Vec<WorkflowRule> = store
        .get("workflow_rules")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    rules.retain(|r| r.id != rule_id);
    store.set("workflow_rules", serde_json::to_value(&rules).unwrap());
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn execute_workflow(
    app_handle: AppHandle,
    capture_mode: String,
    file_path: String,
) -> Result<Vec<WorkflowResult>, String> {
    let store = app_handle.get_store("settings.json").ok_or("Store not found")?;
    let rules: Vec<WorkflowRule> = store
        .get("workflow_rules")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let mut results = Vec::new();

    for rule in rules.iter().filter(|r| r.enabled) {
        let matches = rule.conditions.iter().all(|c| match c.condition_type.as_str() {
            "captureMode" => c.value == capture_mode || c.value == "*",
            _ => true,
        });

        if !matches {
            continue;
        }

        let mut executed = Vec::new();
        let mut errors = Vec::new();

        for action in rule.actions.iter().filter(|a| a.enabled) {
            match action.action_type.as_str() {
                "copyToClipboard" => {
                    match crate::common::copy_picture_to_clipboard(app_handle.clone(), file_path.clone()).await {
                        Ok(_) => executed.push("copyToClipboard".to_string()),
                        Err(e) => errors.push(format!("copyToClipboard: {}", e)),
                    }
                }
                "saveToDefault" => {
                    executed.push("saveToDefault".to_string());
                }
                "openEditor" => {
                    executed.push("openEditor".to_string());
                }
                _ => {
                    errors.push(format!("Unknown action: {}", action.action_type));
                }
            }

            if rule.stop_on_failure && !errors.is_empty() {
                break;
            }
        }

        results.push(WorkflowResult {
            rule_id: rule.id.clone(),
            actions_executed: executed,
            errors,
        });
    }

    info!("Executed {} workflow rules", results.len());
    Ok(results)
}
