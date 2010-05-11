import zope.component
from zope.app.pagetemplate.viewpagetemplatefile import ViewPageTemplateFile
from plone.z3cform import layout

from pmr2.app.browser.exposure import ExposureFileViewBase
from pmr2.app.browser.layout import PlainLayoutWrapper

from fieldml.pmr2.browser.layout import ZincLayoutWrapper


class ZincViewer(ExposureFileViewBase):
    """\
    Wraps an object around the Zinc viewer.
    """

    template = ViewPageTemplateFile('zinc_content.pt')

    def _getPath(self, filename):
        uri = self.context.absolute_url()
        # take the "dirname" of the context and apply the path in place.
        path, id_ = uri.rsplit('/', 1)
        return '/'.join([path, filename])

    @property
    def exnode(self):
        return self._getPath(self.note.exnode)

    @property
    def exelem(self):
        return self._getPath(self.note.exelem)

ZincViewerView = layout.wrap_form(ZincViewer, __wrapper_class=ZincLayoutWrapper)


class FieldMLMetadata(ExposureFileViewBase):
    """\
    Wraps an object around the Zinc viewer.
    """

    template = ViewPageTemplateFile('fieldml_metadata.pt')

FieldMLMetadataView = layout.wrap_form(FieldMLMetadata)
