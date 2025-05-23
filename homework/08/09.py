def most_common(nums):
    if not nums:
        return None  # 或 raise ValueError("Input list is empty")
    
    count = {}
    for num in nums:
        count[num] = count.get(num, 0) + 1

    max_count = max(count.values())
