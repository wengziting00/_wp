def average(nums):
    if not nums:
        return None 
    avg = sum(nums) / len(nums)
    return round(avg, 1)
