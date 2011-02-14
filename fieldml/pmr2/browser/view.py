import zope.component
from zope.app.pagetemplate.viewpagetemplatefile import ViewPageTemplateFile
from plone.z3cform import layout

from pmr2.app.exposure.browser.browser import ExposureFileViewBase
from pmr2.app.browser.layout import PlainLayoutWrapper

from fieldml.pmr2.browser.layout import ZincLayoutWrapper
from fieldml.pmr2.browser.layout import JsonZincLayoutWrapper


class BaseZincViewer(ExposureFileViewBase):
    """\
    Base Zinc Viewer to provide a private helper to assist resolving
    full path of files.
    """

    def _getPath(self, filename):
        uri = self.context.absolute_url()
        # take the "dirname" of the context and apply the path in place.
        path, id_ = uri.rsplit('/', 1)
        return '/'.join([path, filename])


class ZincViewer(BaseZincViewer):
    """\
    Wraps an object around the Zinc viewer.
    """

    template = ViewPageTemplateFile('zinc_content.pt')

    @property
    def exnode(self):
        return self._getPath(self.note.exnode)

    @property
    def exelem(self):
        return self._getPath(self.note.exelem)

ZincViewerView = layout.wrap_form(ZincViewer, __wrapper_class=ZincLayoutWrapper)


class JsonZincViewer(BaseZincViewer):
    """\
    Wraps an object around the JSON Zinc viewer.
    """

    template = ViewPageTemplateFile('json_zinc_content.pt')

    @property
    def json(self):
        return self._getPath(self.note.json)

JsonZincViewerView = layout.wrap_form(JsonZincViewer, __wrapper_class=JsonZincLayoutWrapper)


class FieldMLMetadata(ExposureFileViewBase):
    """\
    Wraps an object around the Zinc viewer.
    """

    template = ViewPageTemplateFile('fieldml_metadata.pt')

FieldMLMetadataView = layout.wrap_form(FieldMLMetadata)
