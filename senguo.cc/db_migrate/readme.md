数据库迁移注意事项
============


# 方法

1. 生成修订数据库版本，其中{msg}为版本提示
   > alembic revision --autogenerate -m {msg}
2. **检查这次版本做出的更改信息，并确保迁移操作正确，否则做出相应更改**
3. 执行迁移
   > alembic upgrate head

