class Logger:
    @classmethod
    def warn(cls, title, detail=""):
        print("[◉]", title, detail)
    @classmethod
    def error(cls, title, detail=""):
        print("[✖︎]", title, detail)
    @classmethod
    def info(cls, title, detail=""):
        print("[⚠]", title, detail)
