import subprocess
import argparse
import csv
import time
from datetime import datetime
import logging
from config import PerformanceConfig

def setup_logging():
    """Setup logging configuration"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    logging.basicConfig(
        filename=f'performance_test_{timestamp}.log',
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    logging.getLogger().addHandler(console_handler)

def run_locust_test(test_type: str, host: str, results_file: str):
    """Run a Locust test with specified configuration"""
    config = PerformanceConfig()
    test_config = config.get_test_pattern(test_type)
    
    if not test_config:
        raise ValueError(f"Invalid test type: {test_type}")
    
    cmd = [
        "locust",
        "-f", "locustfile.py",
        "--host", host,
        "--headless",
        "--users", str(test_config["users"]),
        "--spawn-rate", str(test_config["spawn_rate"]),
        "--run-time", test_config["duration"],
        "--csv", results_file
    ]
    
    logging.info(f"Starting {test_type} test with configuration: {test_config}")
    
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            logging.error(f"Test failed with error: {stderr.decode()}")
            raise Exception(f"Test failed: {stderr.decode()}")
        
        logging.info(f"Test completed successfully: {stdout.decode()}")
        return True
        
    except Exception as e:
        logging.error(f"Error running test: {str(e)}")
        return False

def analyze_results(results_file: str, test_type: str):
    """Analyze test results and compare with thresholds"""
    config = PerformanceConfig()
    thresholds = config.thresholds

    with open(f"{results_file}_stats.csv", "r") as csvfile:
        try:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row["Name"] == "Aggregated":
                    p95 = float(row["95%"])
                    error_rate = float(row["Failure Count"])
                    rps = float(row["Requests/s"])
                    
                    if p95 > thresholds.response_time_p95:
                        logging.warning(f"P95 response time exceeded: {p95}ms")
                    if error_rate > thresholds.error_rate_threshold:
                        logging.warning(f"Error rate exceeded: {error_rate}%")
                    logging.info(f"Test {test_type}: P95 {p95}ms, Errors {error_rate}%, RPS {rps}")
        except Exception as e:
            logging.error(f"Error analyzing results: {str(e)}")


def main():
    parser = argparse.ArgumentParser(description="Run performance tests")
    parser.add_argument("--host", required=True, help="Target host URL")
    parser.add_argument("--test-type", required=True, help="Type of performance test to run")
    args = parser.parse_args()
    
    setup_logging()
    logging.info(f"Starting {args.test_type} test against {args.host}")
    name_of_csv_file = f"results_{args.test_type.lower()}_{int(time.time())}"
    if run_locust_test(args.test_type, args.host, name_of_csv_file):
        analyze_results(name_of_csv_file, args.test_type)

if __name__ == "__main__":
    main()
