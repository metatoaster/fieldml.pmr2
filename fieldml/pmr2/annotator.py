import zope.interface
import zope.component

from pmr2.app.factory import named_factory
from pmr2.app.annotation.interfaces import *
from pmr2.app.annotation.annotator import ExposureFileAnnotatorBase

from fieldml.pmr2.interfaces import *
from fieldml.pmr2.rdf import RdfExposureNoteHelper


class ZincViewerAnnotator(ExposureFileAnnotatorBase):
    zope.interface.implements(IExposureFileAnnotator)
    for_interface = IZincViewerNote
    title = u'Zinc Viewer'
    label = u'Zinc Viewer'

    def generate(self):
        helper = RdfExposureNoteHelper()
        helper.parse(self.input)
        return helper.queryEFNote(self.__name__)

ZincViewerAnnotatorFactory = named_factory(ZincViewerAnnotator)


class FieldMLMetadataAnnotator(ExposureFileAnnotatorBase):
    zope.interface.implements(IExposureFileAnnotator)
    for_interface = IFieldMLMetadataNote
    title = u'FieldML Metadata'
    label = u'FieldML Metadata'

    def generate(self):
        helper = RdfExposureNoteHelper()
        helper.parse(self.input)
        result = helper.queryDC('')
        if not result:
            return ()

        # XXX not handling multiple results
        # take first element, strip off namespaces
        return tuple([(k[3:], v) for k, v in result[0]])

FieldMLMetadataAnnotatorFactory = named_factory(FieldMLMetadataAnnotator)
