def find_max(numbers):
    if not numbers: 
        return None  
    max_value = numbers[0]
    for num in numbers[1:]:
        if num > max_value:
            max_value = num
    return max_value
