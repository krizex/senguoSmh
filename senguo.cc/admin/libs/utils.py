class Logger:
    @classmethod
    def warn(cls, title, detail=""):
        print("[W]", title, detail)
    @classmethod
    def error(cls, title, detail=""):
        print("[E]", title, detail)
    @classmethod
    def info(cls, title, detail=""):
        print("[I]", title, detail)
