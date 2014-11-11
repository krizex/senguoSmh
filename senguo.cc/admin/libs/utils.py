class Logger:
    @classmethod
    def warn(cls, title, detail=""):
        print("[warn]", title, detail)
    @classmethod
    def error(cls, title, detail=""):
        print("[error]", title, detail)
    @classmethod
    def info(cls, title, detail=""):
        print("[info]", title, detail)
