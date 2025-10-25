#!/usr/bin/env python3
"""
Test script for parse_json_from_markdown function
"""

import json
from app import parse_json_from_markdown

def test_parse_json_from_markdown():
    """Test the parse_json_from_markdown function with various input formats"""
    
    print("🧪 Testing parse_json_from_markdown function...")
    print("=" * 50)
    
    # Test case 1: Direct JSON
    print("\n1. Testing direct JSON:")
    direct_json = '{"success": true, "topic_id": "123", "message": "Success"}'
    result, should_retry = parse_json_from_markdown(direct_json)
    print(f"Input: {direct_json}")
    print(f"Result: {result}")
    print(f"Should retry: {should_retry}")
    assert result is not None
    assert result["success"] == True
    assert should_retry == False
    print("✅ PASSED")
    
    # Test case 2: JSON with success=false (should trigger retry)
    print("\n2. Testing JSON with success=false:")
    failure_json = '{ "success": false, "topic_id": null, "message": "Failed to insert topic to Convex database: CONVEX_URL environment variable not set", "metadata": null }'
    result, should_retry = parse_json_from_markdown(failure_json)
    print(f"Input: {failure_json}")
    print(f"Result: {result}")
    print(f"Should retry: {should_retry}")
    assert result is not None
    assert result["success"] == False
    assert should_retry == True
    print("✅ PASSED")
    
    # Test case 3: JSON in markdown code block with json specifier
    print("\n3. Testing JSON in markdown code block (```json):")
    markdown_json = '''```json
{
    "success": true,
    "topic_id": "456",
    "message": "Generated successfully",
    "metadata": {
        "word_count": 1500,
        "exercise_count": 8
    }
}
```'''
    result, should_retry = parse_json_from_markdown(markdown_json)
    print(f"Input: {markdown_json[:50]}...")
    print(f"Result: {result}")
    print(f"Should retry: {should_retry}")
    assert result is not None
    assert result["success"] == True
    assert result["topic_id"] == "456"
    assert should_retry == False
    print("✅ PASSED")
    
    # Test case 4: JSON in generic markdown code block
    print("\n4. Testing JSON in generic markdown code block (```):")
    generic_markdown = '''```
{
    "success": false,
    "topic_id": null,
    "message": "Failed to generate topic",
    "metadata": null
}
```'''
    result, should_retry = parse_json_from_markdown(generic_markdown)
    print(f"Input: {generic_markdown[:50]}...")
    print(f"Result: {result}")
    print(f"Should retry: {should_retry}")
    assert result is not None
    assert result["success"] == False
    assert should_retry == True
    print("✅ PASSED")
    
    # Test case 5: JSON with extra text around it
    print("\n5. Testing JSON with surrounding text:")
    text_with_json = '''Here is the result:

```json
{
    "success": true,
    "topic_id": "789",
    "message": "Topic created successfully"
}
```

The operation completed successfully.'''
    result, should_retry = parse_json_from_markdown(text_with_json)
    print(f"Input: {text_with_json[:50]}...")
    print(f"Result: {result}")
    print(f"Should retry: {should_retry}")
    assert result is not None
    assert result["success"] == True
    assert result["topic_id"] == "789"
    assert should_retry == False
    print("✅ PASSED")
    
    # Test case 6: Invalid JSON (should return None and trigger retry)
    print("\n6. Testing invalid JSON:")
    invalid_json = '{"success": true, "topic_id": "123", "message": "Success"'  # Missing closing brace
    result, should_retry = parse_json_from_markdown(invalid_json)
    print(f"Input: {invalid_json}")
    print(f"Result: {result}")
    print(f"Should retry: {should_retry}")
    assert result is None
    assert should_retry == True
    print("✅ PASSED")
    
    # Test case 7: Non-JSON text
    print("\n7. Testing non-JSON text:")
    non_json = "This is just regular text without any JSON content."
    result, should_retry = parse_json_from_markdown(non_json)
    print(f"Input: {non_json}")
    print(f"Result: {result}")
    print(f"Should retry: {should_retry}")
    assert result is None
    assert should_retry == True
    print("✅ PASSED")
    
    # Test case 8: Complex JSON with nested objects
    print("\n8. Testing complex nested JSON:")
    complex_json = '''```json
{
    "success": true,
    "topic_id": "complex_123",
    "message": "Successfully generated complex topic",
    "metadata": {
        "word_count": 2500,
        "estimated_read_time": 12,
        "exercise_count": 15,
        "information_block_count": 7,
        "published": true,
        "categories": ["Science", "Technology"],
        "tags": ["AI", "Machine Learning", "Neural Networks"]
    }
}
```'''
    result, should_retry = parse_json_from_markdown(complex_json)
    print(f"Input: {complex_json[:50]}...")
    print(f"Result: {result}")
    print(f"Should retry: {should_retry}")
    assert result is not None
    assert result["success"] == True
    assert result["metadata"]["word_count"] == 2500
    assert "AI" in result["metadata"]["tags"]
    assert should_retry == False
    print("✅ PASSED")
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed successfully!")
    print("The parse_json_from_markdown function is working correctly.")

def test_edge_cases():
    """Test edge cases and error conditions"""
    
    print("\n🔍 Testing edge cases...")
    print("=" * 30)
    
    # Test empty string
    print("\n1. Testing empty string:")
    result, should_retry = parse_json_from_markdown("")
    print(f"Result: {result}, Should retry: {should_retry}")
    assert result is None
    assert should_retry == True
    print("✅ PASSED")
    
    # Test None input (this would cause an error in real usage)
    print("\n2. Testing whitespace only:")
    result, should_retry = parse_json_from_markdown("   \n\t  ")
    print(f"Result: {result}, Should retry: {should_retry}")
    assert result is None
    assert should_retry == True
    print("✅ PASSED")
    
    # Test multiple JSON blocks (should pick the first one)
    print("\n3. Testing multiple JSON blocks:")
    multiple_json = '''First block:
```json
{"success": true, "topic_id": "first"}
```

Second block:
```json
{"success": false, "topic_id": "second"}
```'''
    result, should_retry = parse_json_from_markdown(multiple_json)
    print(f"Result: {result}, Should retry: {should_retry}")
    assert result is not None
    assert result["topic_id"] == "first"  # Should pick the first one
    assert should_retry == False
    print("✅ PASSED")
    
    print("\n🎉 Edge case tests passed!")

if __name__ == "__main__":
    try:
        test_parse_json_from_markdown()
        test_edge_cases()
        print("\n✨ All tests completed successfully!")
    except Exception as e:
        print(f"\n💥 Test failed with error: {e}")
        import traceback
        traceback.print_exc()