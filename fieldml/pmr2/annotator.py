import zope.interface
import zope.component

from pmr2.app.factory import named_factory
from pmr2.app.annotation.interfaces import *
from pmr2.app.annotation.annotator import ExposureFileAnnotatorBase

from fieldml.pmr2.rdf import RdfExposureNoteHelper


class ZincViewerAnnotator(ExposureFileAnnotatorBase):
    zope.interface.implements(IExposureFileAnnotator)
    title = u'Zinc Viewer'
    label = u'Zinc Viewer'

    def generate(self):
        helper = RdfExposureNoteHelper()
        helper.parse(self.input)
        return helper.queryNote(self.__name__)

ZincViewerAnnotatorFactory = named_factory(ZincViewerAnnotator)

