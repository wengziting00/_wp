def summary(data):
    for student in data:
        name = student['name']
        scores = student['scores']
        total = sum(scores)
        average = round(total / len(scores), 1) if scores else 0
        print(f"{name} - 總分: {total}, 平均: {average}")
