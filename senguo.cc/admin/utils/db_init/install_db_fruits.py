import sys, os

sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__),"../..")))

from db_fruits import fruit_types as fruits

import dal.models as models


if __name__ == "__main__":
    s= models.DBSession()
    for fruit in fruits:
        print("adding fruit ", fruit["name"])
        s.add(models.FruitType(name=fruit["name"], code=fruit["code"]))
    s.commit()
    s.close()
    print("done.")
