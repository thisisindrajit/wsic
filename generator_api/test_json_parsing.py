#!/usr/bin/env python3
"""
Test script for JSON parsing from markdown
"""
import json
import re

def parse_json_from_markdown(text):
    """Parse JSON from markdown code blocks or plain text"""
    try:
        # First, try to parse as direct JSON
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            # If that fails, look for JSON within markdown code blocks
            
            # Pattern to match ```json\n...content...\n```
            json_pattern = r'```json\s*\n(.*?)\n```'
            match = re.search(json_pattern, text, re.DOTALL)
            
            if match:
                json_content = match.group(1)
                return json.loads(json_content)
            
            # Pattern to match ```\n...content...\n``` (without json specifier)
            generic_pattern = r'```\s*\n(.*?)\n```'
            match = re.search(generic_pattern, text, re.DOTALL)
            
            if match:
                json_content = match.group(1)
                return json.loads(json_content)
            
            # If no code blocks found, try parsing the text directly
            return json.loads(text)
            
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Failed to parse JSON from text: {e}")
            return None

def test_parsing():
    # Test case 1: JSON wrapped in markdown code blocks
    test_text_1 = '''```json
{
    "success": true,
    "topic_id": "jh7de5kmkansx0zs34gaa93kw57qhfz6",
    "message": "Successfully inserted topic 'Multithreading' with ID: jh7de5kmkansx0zs34gaa93kw57qhfz6",
    "metadata": {
        "estimated_read_time": 5,
        "exercise_count": 9,
        "information_block_count": 4,
        "published": true,
        "word_count": 1185
    }
}
```'''
    
    # Test case 2: Plain JSON
    test_text_2 = '''{"status": "VALID", "reason": "Merkle Tree is a well-defined concept in computer science and cryptography, suitable for educational content."}'''
    
    # Test case 3: Generic code blocks
    test_text_3 = '''```
{
    "success": true,
    "topic_id": "test123"
}
```'''
    
    print("Testing JSON parsing...")
    
    result1 = parse_json_from_markdown(test_text_1)
    print(f"Test 1 (markdown json): {result1}")
    
    result2 = parse_json_from_markdown(test_text_2)
    print(f"Test 2 (plain json): {result2}")
    
    result3 = parse_json_from_markdown(test_text_3)
    print(f"Test 3 (generic markdown): {result3}")

if __name__ == "__main__":
    test_parsing()