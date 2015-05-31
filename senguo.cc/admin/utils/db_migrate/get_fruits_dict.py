import pymongo

conn = pymongo.Connection()["wf_root"]

fruits = []
print("[", end="")
i = 0
for rs in conn["fruits"].find():
    print({
        "name":rs["name"],
        "code":rs["codeName"]}, ",")
    i += 1

print("]")
print(i)

