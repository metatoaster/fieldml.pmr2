from os.path import dirname, join
from unittest import TestCase, TestSuite, makeSuite

from zope.interface import implements
from zope.component import provideAdapter
from zope.interface.verify import verifyClass
from zope.publisher.interfaces import IPublishTraverse
from paste.httpexceptions import HTTPNotFound, HTTPFound

from pmr2.testing.base import TestRequest

from pmr2.app.interfaces import *
from pmr2.app.exposure.interfaces import *
from pmr2.app.exposure.content import ExposureContainer, Exposure
from pmr2.app.exposure.tests.base import ExposureDocTestCase

from fieldml.pmr2.annotator import ZincViewerAnnotator
from fieldml.pmr2.annotator import JsonZincViewerAnnotator
from fieldml.pmr2.annotator import FieldMLMetadataAnnotator


class MockWorkspace:
    def absolute_url(self):
        return 'http://nohost/mw'

mock_workspace = MockWorkspace()

class MockExposureObject:
    # emulates all things Exposure
    implements(IExposureFolder, IExposureFile, IExposure)
    commit_id = '123'
    keys = ['valid']
    path = ''
    test_input = 'input'

    def __init__(self, filename):
        self.filename = join(dirname(__file__), self.test_input, filename)


class MockExposureSource:
    implements(IExposureSourceAdapter)

    def __init__(self, context):
        self.context = context

    def source(self):
        return self.context, mock_workspace, self.context.path

    def file(self):
        fd = open(self.context.filename)
        result = fd.read()
        fd.close()
        return result


class TestZincViewerAnnotator(TestCase):

    def setUp(self):
        self.context = MockExposureObject('body.fieldml')
        provideAdapter(MockExposureSource, (MockExposureObject,), 
            IExposureSourceAdapter)

    def tearDown(self):
        pass

    def test_0000_zinc_viewer_basic(self):
        annotator = ZincViewerAnnotator(self.context)
        # must assign the name like how this would have generated via
        # adapter.
        annotator.__name__ = 'zinc_viewer'
        results = dict(annotator.generate())
        answer = {
            u'exnode': u'body.exnode',
            u'exelem': u'body.exelem',
        }
        self.assertEqual(answer, results)

    def test_0010_json_zinc_viewer_basic(self):
        annotator = JsonZincViewerAnnotator(self.context)
        # must assign the name like how this would have generated via
        # adapter.
        annotator.__name__ = 'json_zinc_viewer'
        results = dict(annotator.generate())
        answer = {
            u'json': u'body.json',
        }
        self.assertEqual(answer, results)

    def test_0100_metadata_basic(self):
        annotator = FieldMLMetadataAnnotator(self.context)
        results = annotator.generate()
        answer = (
            ('title', u'Body Mesh'),
            ('creator', u'Auckland Bioengineering Institute'),
            ('description', u'Simple Body Mesh'),
            ('citation', None),
            ('partof', None),
        )
        self.assertEqual(answer, results)

    def test_0101_metadata_multiple_creator(self):
        context = MockExposureObject('body2.fieldml')
        annotator = FieldMLMetadataAnnotator(context)
        results = annotator.generate()
        answer = (
            ('title', u'Body Mesh'),
            ('creator', u'Creator1, Creator2'),
            ('description', u'Simple Body Mesh'),
            ('citation', u'Cited Work(1)'),
            ('partof', u'urn:example:body_mesh'),
        )
        self.assertEqual(answer, results)

def test_suite():
    suite = TestSuite()
    suite.addTest(makeSuite(TestZincViewerAnnotator))
    return suite

