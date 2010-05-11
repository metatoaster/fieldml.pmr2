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
    exnode = fieldproperty.FieldProperty(IZincViewerNote['exnode'])
    exelem = fieldproperty.FieldProperty(IZincViewerNote['exelem'])


class FieldMLMetadataNote(ExposureFileNoteBase):
    """\
    Points to the OpenCell session attached to this file.
    """

    zope.interface.implements(IFieldMLMetadataNote)
    title = fieldproperty.FieldProperty(IFieldMLMetadataNote['title'])
    creator = fieldproperty.FieldProperty(IFieldMLMetadataNote['creator'])
    description = fieldproperty.FieldProperty(IFieldMLMetadataNote['description'])
