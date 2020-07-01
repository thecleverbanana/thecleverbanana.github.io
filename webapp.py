import web

urls = (
    '/bananaleaf','Bananaleaf',
)

class Bananaleaf:
    def GET(self):
        return 'Hello World'


app = web.application(urls,globals())
if __name__ == '__main__':
    app.run()


