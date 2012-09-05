import zope.component
from zope.app.pagetemplate.viewpagetemplatefile import ViewPageTemplateFile

from Acquisition import aq_inner

from pmr2.app.exposure.browser.browser import ExposureFileViewBase


class BaseZincViewer(ExposureFileViewBase):
    """\
    Base Zinc Viewer to provide a private helper to assist resolving
    full path of files.
    """

    @property
    def js_root(self):
        """
        Return the root of the js library for fieldml.pmr2
        """

        context = aq_inner(self.context)
        portal_state = zope.component.getMultiAdapter((context, self.request),
            name=u'plone_portal_state')
        portal_url = portal_state.portal_url()
        return '/'.join((portal_url, '++resource++fieldml.pmr2.js'))

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


class JsonZincViewer(BaseZincViewer):
    """\
    Wraps an object around the JSON Zinc viewer.
    """

    template = ViewPageTemplateFile('json_zinc_content.pt')

    @property
    def json(self):
        return self._getPath(self.note.json)


class FieldMLMetadata(ExposureFileViewBase):
    """\
    Wraps an object around the Zinc viewer.
    """

    template = ViewPageTemplateFile('fieldml_metadata.pt')
