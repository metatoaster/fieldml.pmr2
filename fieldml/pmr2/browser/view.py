import zope.component
from zope.app.pagetemplate.viewpagetemplatefile import ViewPageTemplateFile
from plone.z3cform import layout

from pmr2.app.browser.exposure import ExposureFileViewBase
from pmr2.app.browser.layout import PlainLayoutWrapper


class CMGuiViewer(ExposureFileViewBase):
    """\
    Wraps an object around the CMGui viewer.
    """

    template = ViewPageTemplateFile('cmgui_viewer.pt')

CMGuiViewerView = layout.wrap_form(CMGuiViewer, __wrapper_class=PlainLayoutWrapper)
