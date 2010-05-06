import zope.interface
import zope.schema


class IZincViewerNote(zope.interface.Interface):
    """\
    Zinc Viewer note.
    """

    exnode = zope.schema.TextLine(
        title=u'Exnode file',
        description=u'The exnode file for this model.',
    )

    exelem = zope.schema.TextLine(
        title=u'Exelem file',
        description=u'The exelem file for this model.',
    )
