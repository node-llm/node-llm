#!/bin/bash

# Find all run.sh scripts strictly inside examples/scripts and run them one by one.

# Ensure we're running from the project root
if [[ ! -d "examples/scripts" ]]; then
  echo "Error: This script must be run from the repository root."
  exit 1
fi

echo "========================================"
echo "🚀 Running all provider example scripts "
echo "========================================"

FAILED_SCRIPTS=()

# Using a standard for loop to avoid subshell and process substitution issues
for script in $(find examples/scripts -type f -name "run.sh"); do
  echo ""
  echo "----------------------------------------"
  echo "▶️ Executing: $script"
  echo "----------------------------------------"
  
  # Run the script from the project root
  bash "$script"
  
  status=$?
  if [ $status -ne 0 ]; then
    echo "❌ Error in $script (exit code: $status)"
    FAILED_SCRIPTS+=("$script (exit code: $status)")
  else
    echo "✅ Successfully completed $script"
  fi
done

echo ""
echo "========================================"
if [ ${#FAILED_SCRIPTS[@]} -eq 0 ]; then
  echo "🎉 All scripts execution finished successfully!"
else
  echo "⚠️ Finished with errors!"
  echo "The following scripts failed:"
  for failed in "${FAILED_SCRIPTS[@]}"; do
    echo "  - $failed"
  done
  echo "========================================"
  exit 1
fi
echo "========================================"
