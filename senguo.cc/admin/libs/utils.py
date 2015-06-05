class Logger:
    @classmethod
    def warn(cls, title, detail=""):
        print('\033[37m\033[43m'+'[警告]'+'\033[0m', title, detail)
    @classmethod
    def error(cls, title, detail=""):
        print('\033[37m\033[41m'+'[错误]'+'\033[0m', title, detail)
    @classmethod
    def info(cls, title, detail=""):
        print('\033[37m\033[46m'+'[信息]'+'\033[0m', title, detail)
