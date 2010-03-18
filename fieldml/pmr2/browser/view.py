import zope.component
from zope.app.pagetemplate.viewpagetemplatefile import ViewPageTemplateFile
from plone.z3cform import layout

from pmr2.app.browser.exposure import ExposureFileViewBase
from pmr2.app.browser.layout import PlainLayoutWrapper

from fieldml.pmr2.browser.layout import ZincLayoutWrapper


class CMGuiViewer(ExposureFileViewBase):
    """\
    Wraps an object around the CMGui viewer.
    """

    template = ViewPageTemplateFile('cmgui_viewer.pt')

CMGuiViewerView = layout.wrap_form(CMGuiViewer, __wrapper_class=PlainLayoutWrapper)


class ZincViewer(ExposureFileViewBase):
    """\
    Wraps an object around the Zinc viewer.
    """

    template = ViewPageTemplateFile('zinc_content.pt')

ZincViewerView = layout.wrap_form(ZincViewer, __wrapper_class=ZincLayoutWrapper)
