from os.path import splitext
import zope.interface
from zope.schema import fieldproperty

from pmr2.app.interfaces import *
from pmr2.app.annotation.note import ExposureFileNoteBase

from interfaces import *


class ZincViewerNote(ExposureFileNoteBase):
    """\
    Points to the OpenCell session attached to this file.
    """

    zope.interface.implements(IZincViewerNote)
    validext = ('.exelem', '.exnode',)

    def _getFilename(self, ext):
        uri = self.__parent__.absolute_url()
        u_name, u_ext = splitext(uri)
        if u_ext in self.validext:
            return u_name + ext

    @property
    def exelem(self):
        return self._getFilename('.exelem')

    @property
    def exnode(self):
        return self._getFilename('.exnode')
