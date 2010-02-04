import zope.interface
from zope.schema import fieldproperty

from pmr2.app.interfaces import *
from pmr2.app.annotation.note import ExposureFileEditableNoteBase

from interfaces import *


class CMGuiViewerNote(ExposureFileEditableNoteBase):
    """\
    Points to the OpenCell session attached to this file.
    """

    zope.interface.implements(ICMGuiViewerNote)
    launcher = fieldproperty.FieldProperty(ICMGuiViewerNote['launcher'])
