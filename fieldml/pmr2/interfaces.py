import zope.interface
import zope.schema


class ICMGuiViewerNote(zope.interface.Interface):
    """\
    CMGui Viewer note.
    """

    launcher = zope.schema.TextLine(
        title=u'Launcher',
        description=u'The extra string that is required to launch the CMGui '
                     'viewer properly',
    )
