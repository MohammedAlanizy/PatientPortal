from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class PerformanceThresholds:
    # Response time thresholds (in milliseconds)
    response_time_p95: int = 1000  # 95th percentile should be under 1 second
    response_time_p99: int = 2000  # 99th percentile should be under 2 seconds
    response_time_max: int = 5000  # Maximum acceptable response time
    
    error_rate_threshold: float = 0.01 
    
    min_rps: float = 10.0 
    target_rps: float = 50.0  

@dataclass
class LoadPatterns:
    SMOKE_TEST: Dict[str, Any] = None  
    LOAD_TEST: Dict[str, Any] = None  
    STRESS_TEST: Dict[str, Any] = None 
    SPIKE_TEST: Dict[str, Any] = None  
    ENDURANCE_TEST: Dict[str, Any] = None 
    
    def __post_init__(self):
        self.SMOKE_TEST = {
            "users": 1,
            "spawn_rate": 1,
            "duration": "1m"
        }
        
        self.LOAD_TEST = {
            "users": 50,
            "spawn_rate": 10,
            "duration": "30m"
        }
        
        self.STRESS_TEST = {
            "users": 100,
            "spawn_rate": 20,
            "duration": "15m"
        }
        
        self.SPIKE_TEST = {
            "users": 200,
            "spawn_rate": 50,
            "duration": "5m"
        }
        
        self.ENDURANCE_TEST = {
            "users": 30,
            "spawn_rate": 5,
            "duration": "2h"
        }

# Performance test configuration
class PerformanceConfig:
    def __init__(self):
        self.thresholds = PerformanceThresholds()
        self.load_patterns = LoadPatterns()
        
    def get_test_pattern(self, test_type: str) -> Dict[str, Any]:
        try:
            return getattr(self.load_patterns, test_type.upper())
        except AttributeError:
            raise ValueError(f"Invalid test type: {test_type.upper()}. Available types are: {', '.join(dir(self.load_patterns))}")


# Test data generation configuration
test_data_config = {
    "request_templates": [
        {
            "full_name": "Performance Test User {id}",
            "national_id": "{rand_int_9}",
            "medical_number": "{rand_int_7}"
        }
    ],
    "data_pools": {
        "names": ["John Doe", "Jane Smith", "Bob Johnson"],
        "notes": ["Urgent case", "Regular checkup", "Follow-up required"]
    }
}
