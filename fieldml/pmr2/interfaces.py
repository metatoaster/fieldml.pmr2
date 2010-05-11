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


class IFieldMLMetadataNote(zope.interface.Interface):
    """\
    FieldML Metadata note.
    """

    title = zope.schema.TextLine(
        title=u'Title',
        description=u'Title of the model.',
    )

    creator = zope.schema.TextLine(
        title=u'Creator',
        description=u'Creator of the model.',
        required=False,
    )

    description = zope.schema.TextLine(
        title=u'Description',
        description=u'Description of the model.',
        required=False,
    )
