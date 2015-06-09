class Logger:
    @classmethod
    def warn(cls, title, detail=""):
        print("[◉警告]", title, detail)
    @classmethod
    def error(cls, title, detail=""):
        print("[✖︎错误]", title, detail)
    @classmethod
    def info(cls, title, detail=""):
        print("[⚠信息]", title, detail)
