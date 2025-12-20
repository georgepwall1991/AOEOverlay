use serde::{Deserialize, Serialize};
use super::app_config::MAX_BUILD_ORDER_STEPS;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BuildOrderBranch {
    pub id: String,
    pub name: String,
    pub trigger: Option<String>,
    #[serde(default = "default_branch_start")]
    pub start_step_index: u32,
    pub steps: Vec<BuildOrderStep>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildOrder {
    pub id: String,
    pub name: String,
    pub civilization: String,
    pub description: String,
    pub difficulty: String,
    pub steps: Vec<BuildOrderStep>,
    pub enabled: bool,
    #[serde(default)]
    pub pinned: bool,
    #[serde(default)]
    pub favorite: bool,
    #[serde(default)]
    pub branches: Option<Vec<BuildOrderBranch>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BuildOrderStep {
    pub id: String,
    pub description: String,
    pub timing: Option<String>,
    pub resources: Option<Resources>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Resources {
    pub food: Option<i32>,
    pub wood: Option<i32>,
    pub gold: Option<i32>,
    pub stone: Option<i32>,
}

pub fn validate_build_order_id(id: &str) -> Result<(), String> {
    const MAX_ID_LEN: usize = 64;
    if id.is_empty() {
        return Err("Build order id is required".to_string());
    }
    if id.len() > MAX_ID_LEN {
        return Err(format!(
            "Build order id exceeds max length of {} characters",
            MAX_ID_LEN
        ));
    }
    if !id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Build order id may only contain letters, numbers, '-' or '_'".to_string());
    }
    Ok(())
}

pub fn validate_build_order(order: &BuildOrder) -> Result<(), String> {
    validate_build_order_id(&order.id)?;

    let step_count = order.steps.len();
    if step_count == 0 {
        return Err("Build order must contain at least one step".to_string());
    }
    if step_count > MAX_BUILD_ORDER_STEPS {
        return Err(format!(
            "Build order exceeds maximum of {} steps (has {})",
            MAX_BUILD_ORDER_STEPS, step_count
        ));
    }

    for (idx, step) in order.steps.iter().enumerate() {
        if step.id.trim().is_empty() {
            return Err(format!("Step {} is missing an id", idx + 1));
        }
        if step.description.trim().is_empty() {
            return Err(format!("Step {} is missing a description", idx + 1));
        }
    }

    if let Some(branches) = &order.branches {
        for branch in branches {
            if branch.steps.len() > MAX_BUILD_ORDER_STEPS {
                return Err(format!(
                    "Branch \"{}\" exceeds maximum of {} steps (has {})",
                    branch.name,
                    MAX_BUILD_ORDER_STEPS,
                    branch.steps.len()
                ));
            }
            for (idx, step) in branch.steps.iter().enumerate() {
                if step.id.trim().is_empty() {
                    return Err(format!("Branch {} step {} is missing an id", branch.name, idx + 1));
                }
                if step.description.trim().is_empty() {
                    return Err(format!("Branch {} step {} is missing a description", branch.name, idx + 1));
                }
            }
        }
    }

    Ok(())
}

fn default_branch_start() -> u32 {
    0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_build_order_id() {
        assert!(validate_build_order_id("valid-id_123").is_ok());
        assert!(validate_build_order_id("").is_err());
        assert!(validate_build_order_id("bad id").is_err());
        let long_id = "a".repeat(65);
        assert!(validate_build_order_id(&long_id).is_err());
    }

    #[test]
    fn test_validate_build_order_id_exact_max_length() {
        let exact_max = "a".repeat(64);
        assert!(validate_build_order_id(&exact_max).is_ok());
    }

    #[test]
    fn test_validate_build_order_id_single_char() {
        assert!(validate_build_order_id("a").is_ok());
        assert!(validate_build_order_id("1").is_ok());
        assert!(validate_build_order_id("-").is_ok());
        assert!(validate_build_order_id("_").is_ok());
    }

    #[test]
    fn test_validate_build_order_id_special_chars_rejected() {
        assert!(validate_build_order_id("test@id").is_err());
        assert!(validate_build_order_id("test#id").is_err());
        assert!(validate_build_order_id("test.id").is_err());
        assert!(validate_build_order_id("test/id").is_err());
        assert!(validate_build_order_id("test\\id").is_err());
        assert!(validate_build_order_id("test:id").is_err());
    }

    #[test]
    fn test_validate_build_order_id_unicode_rejected() {
        assert!(validate_build_order_id("テスト").is_err());
        assert!(validate_build_order_id("test-émoji").is_err());
        assert!(validate_build_order_id("test🎮").is_err());
    }

    #[test]
    fn test_validate_build_order_id_whitespace() {
        assert!(validate_build_order_id(" ").is_err());
        assert!(validate_build_order_id("\t").is_err());
        assert!(validate_build_order_id("\n").is_err());
        assert!(validate_build_order_id("test id").is_err());
        assert!(validate_build_order_id(" test").is_err());
        assert!(validate_build_order_id("test ").is_err());
    }

    #[test]
    fn test_validate_build_order_id_mixed_case() {
        assert!(validate_build_order_id("TestID").is_ok());
        assert!(validate_build_order_id("ALLCAPS").is_ok());
        assert!(validate_build_order_id("alllower").is_ok());
        assert!(validate_build_order_id("Mixed-Case_123").is_ok());
    }

    fn create_valid_build_order() -> BuildOrder {
        BuildOrder {
            id: "test-order".to_string(),
            name: "Test Order".to_string(),
            civilization: "English".to_string(),
            description: "A test build order".to_string(),
            difficulty: "Easy".to_string(),
            steps: vec![BuildOrderStep {
                id: "step-1".to_string(),
                description: "First step".to_string(),
                timing: Some("0:00".to_string()),
                resources: None,
            }],
            enabled: true,
            pinned: false,
            favorite: false,
            branches: None,
        }
    }

    #[test]
    fn test_validate_build_order_valid() {
        let order = create_valid_build_order();
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_validate_build_order_empty_steps() {
        let mut order = create_valid_build_order();
        order.steps = vec![];
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("at least one step"));
    }

    #[test]
    fn test_validate_build_order_max_steps() {
        let mut order = create_valid_build_order();
        order.steps = (0..MAX_BUILD_ORDER_STEPS)
            .map(|i| BuildOrderStep {
                id: format!("step-{}", i),
                description: format!("Step {}", i),
                timing: None,
                resources: None,
            })
            .collect();
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_validate_build_order_exceeds_max_steps() {
        let mut order = create_valid_build_order();
        order.steps = (0..=MAX_BUILD_ORDER_STEPS)
            .map(|i| BuildOrderStep {
                id: format!("step-{}", i),
                description: format!("Step {}", i),
                timing: None,
                resources: None,
            })
            .collect();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("exceeds maximum"));
    }

    #[test]
    fn test_validate_build_order_step_empty_id() {
        let mut order = create_valid_build_order();
        order.steps[0].id = "".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing an id"));
    }

    #[test]
    fn test_validate_build_order_step_whitespace_id() {
        let mut order = create_valid_build_order();
        order.steps[0].id = "   ".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing an id"));
    }

    #[test]
    fn test_validate_build_order_step_empty_description() {
        let mut order = create_valid_build_order();
        order.steps[0].description = "".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing a description"));
    }

    #[test]
    fn test_validate_build_order_step_whitespace_description() {
        let mut order = create_valid_build_order();
        order.steps[0].description = "\t\n".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing a description"));
    }

    #[test]
    fn test_validate_build_order_invalid_id() {
        let mut order = create_valid_build_order();
        order.id = "invalid id with spaces".to_string();
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("only contain letters"));
    }

    #[test]
    fn test_validate_build_order_with_branches() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Branch One".to_string(),
            trigger: Some("Age up".to_string()),
            start_step_index: 0,
            steps: vec![BuildOrderStep {
                id: "branch-step-1".to_string(),
                description: "Branch step".to_string(),
                timing: None,
                resources: None,
            }],
        }]);
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_validate_build_order_branch_exceeds_max_steps() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Big Branch".to_string(),
            trigger: None,
            start_step_index: 0,
            steps: (0..=MAX_BUILD_ORDER_STEPS)
                .map(|i| BuildOrderStep {
                    id: format!("step-{}", i),
                    description: format!("Step {}", i),
                    timing: None,
                    resources: None,
                })
                .collect(),
        }]);
        let result = validate_build_order(&order);
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Branch"));
        assert!(err_msg.contains("exceeds maximum"));
    }

    #[test]
    fn test_validate_build_order_branch_empty_step_id() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Test Branch".to_string(),
            trigger: None,
            start_step_index: 0,
            steps: vec![BuildOrderStep {
                id: "".to_string(),
                description: "Valid description".to_string(),
                timing: None,
                resources: None,
            }],
        }]);
        let result = validate_build_order(&order);
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Branch"));
        assert!(err_msg.contains("missing an id"));
    }

    #[test]
    fn test_validate_build_order_branch_empty_step_description() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Test Branch".to_string(),
            trigger: None,
            start_step_index: 0,
            steps: vec![BuildOrderStep {
                id: "valid-id".to_string(),
                description: "".to_string(),
                timing: None,
                resources: None,
            }],
        }]);
        let result = validate_build_order(&order);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing a description"));
    }

    #[test]
    fn test_validate_build_order_multiple_branches() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![
            BuildOrderBranch {
                id: "branch-1".to_string(),
                name: "Branch One".to_string(),
                trigger: Some("Feudal".to_string()),
                start_step_index: 0,
                steps: vec![BuildOrderStep {
                    id: "b1-step".to_string(),
                    description: "Branch 1 step".to_string(),
                    timing: None,
                    resources: None,
                }],
            },
            BuildOrderBranch {
                id: "branch-2".to_string(),
                name: "Branch Two".to_string(),
                trigger: Some("Castle".to_string()),
                start_step_index: 5,
                steps: vec![BuildOrderStep {
                    id: "b2-step".to_string(),
                    description: "Branch 2 step".to_string(),
                    timing: None,
                    resources: None,
                }],
            },
        ]);
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_validate_build_order_empty_branches_vec() {
        let mut order = create_valid_build_order();
        order.branches = Some(vec![]);
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_default_branch_start() {
        assert_eq!(default_branch_start(), 0);
    }

    #[test]
    fn test_resources_all_fields() {
        let resources = Resources {
            food: Some(100),
            wood: Some(200),
            gold: Some(300),
            stone: Some(400),
        };
        assert_eq!(resources.food, Some(100));
        assert_eq!(resources.wood, Some(200));
        assert_eq!(resources.gold, Some(300));
        assert_eq!(resources.stone, Some(400));
    }

    #[test]
    fn test_resources_partial_fields() {
        let resources = Resources {
            food: Some(50),
            wood: None,
            gold: None,
            stone: None,
        };
        assert!(resources.food.is_some());
        assert!(resources.wood.is_none());
    }

    #[test]
    fn test_resources_negative_values() {
        let resources = Resources {
            food: Some(-100),
            wood: Some(-50),
            gold: None,
            stone: None,
        };
        assert_eq!(resources.food, Some(-100));
    }

    #[test]
    fn test_resources_zero_values() {
        let resources = Resources {
            food: Some(0),
            wood: Some(0),
            gold: Some(0),
            stone: Some(0),
        };
        assert_eq!(resources.food, Some(0));
    }

    #[test]
    fn test_build_order_step_minimal() {
        let step = BuildOrderStep {
            id: "s1".to_string(),
            description: "Do something".to_string(),
            timing: None,
            resources: None,
        };
        assert!(step.timing.is_none());
        assert!(step.resources.is_none());
    }

    #[test]
    fn test_build_order_step_with_timing() {
        let step = BuildOrderStep {
            id: "s1".to_string(),
            description: "Build house".to_string(),
            timing: Some("1:30".to_string()),
            resources: None,
        };
        assert_eq!(step.timing, Some("1:30".to_string()));
    }

    #[test]
    fn test_build_order_step_with_resources() {
        let step = BuildOrderStep {
            id: "s1".to_string(),
            description: "Build house".to_string(),
            timing: None,
            resources: Some(Resources {
                food: None,
                wood: Some(50),
                gold: None,
                stone: None,
            }),
        };
        assert!(step.resources.is_some());
        assert_eq!(step.resources.unwrap().wood, Some(50));
    }

    #[test]
    fn test_build_order_pinned_field() {
        let mut order = create_valid_build_order();
        order.pinned = true;
        assert!(order.pinned);
    }

    #[test]
    fn test_build_order_favorite_field() {
        let mut order = create_valid_build_order();
        order.favorite = true;
        assert!(order.favorite);
    }

    #[test]
    fn test_build_order_branch_no_trigger() {
        let branch = BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Test Branch".to_string(),
            trigger: None,
            start_step_index: 0,
            steps: vec![],
        };
        assert!(branch.trigger.is_none());
    }

    #[test]
    fn test_build_order_branch_with_start_index() {
        let branch = BuildOrderBranch {
            id: "branch-1".to_string(),
            name: "Late Branch".to_string(),
            trigger: Some("Castle Age".to_string()),
            start_step_index: 15,
            steps: vec![],
        };
        assert_eq!(branch.start_step_index, 15);
    }

    #[test]
    fn test_validate_build_order_step_index_in_error() {
        let mut order = create_valid_build_order();
        order.steps = vec![
            BuildOrderStep {
                id: "s1".to_string(),
                description: "First".to_string(),
                timing: None,
                resources: None,
            },
            BuildOrderStep {
                id: "".to_string(),
                description: "Second".to_string(),
                timing: None,
                resources: None,
            },
        ];
        let result = validate_build_order(&order);
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Step 2"));
    }

    #[test]
    fn test_build_order_any_civilization() {
        let mut order = create_valid_build_order();
        order.civilization = "CustomCiv".to_string();
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_build_order_any_difficulty() {
        let mut order = create_valid_build_order();
        order.difficulty = "Expert".to_string();
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_build_order_empty_name() {
        let mut order = create_valid_build_order();
        order.name = "".to_string();
        assert!(validate_build_order(&order).is_ok());
    }

    #[test]
    fn test_build_order_step_long_description() {
        let mut order = create_valid_build_order();
        order.steps[0].description = "A".repeat(10000);
        assert!(validate_build_order(&order).is_ok());
    }
}
