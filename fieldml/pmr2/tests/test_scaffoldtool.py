import unittest
import logging
import os
from StringIO import StringIO
from gzip import open as gzip_open
from tempfile import mkdtemp
from os.path import dirname
from os.path import isdir
from os.path import join
from os import listdir
from shutil import rmtree

import zope.component
from plone.registry.interfaces import IRegistry
from Products.CMFCore.utils import getToolByName

from pmr2.app.exposure.interfaces import IExposureFile
from pmr2.app.exposure.content import ExposureFile
from pmr2.app.exposure.browser import util

from pmr2.app.annotation import note_factory
from pmr2.app.annotation.tests import adapter
from pmr2.app.annotation.tests import content
from pmr2.app.annotation.interfaces import IExposureFileAnnotator

from pmr2.testing.base import TestRequest

from fieldml.pmr2.interfaces import IZincJSUtility
from fieldml.pmr2.interfaces import ISettings
from fieldml.pmr2.utility import ZincJSUtility
from fieldml.pmr2.testing import layer


class UtilsTestCase(unittest.TestCase):

    # Just using the integration layer for now until I figure out how to
    # split this off in cleaner ways.
    layer = layer.FIELDML_UTILITY_INTEGRATION_LAYER

    def setUp(self):
        self.portal = self.layer['portal']
        self.testdir = mkdtemp()
        self.logger = logging.getLogger()

        self.stream = StringIO()
        self.handler = logging.StreamHandler(self.stream)
        self.handler.setFormatter(logging.Formatter(
            u'%(asctime)s %(levelname)s %(name)s %(message)s'))
        self.logger.addHandler(self.handler)
        self.logger.setLevel(logging.DEBUG)

    def tearDown(self):
        rmtree(self.testdir)
        self.logger.removeHandler(self.handler)

    def test_zincjs_settings(self):
        registry = zope.component.getUtility(IRegistry)
        settings = registry.forInterface(
            ISettings, prefix='fieldml.pmr2.settings')
        self.assertEqual(
            settings.zincjs_group_exporter, 'zincjs_group_exporter')

    def test_zincjs_utility_registered(self):
        utility = zope.component.queryUtility(IZincJSUtility)
        self.assertTrue(isinstance(utility, ZincJSUtility))

    def test_zincjs_utility_usage_without_binary(self):
        utility = zope.component.queryUtility(IZincJSUtility)
        utility(self.testdir, '')

        self.assertIn(
            'unable to find the zincjs_group_exporter binary',
            self.stream.getvalue()
        )

    @unittest.skipIf(
        'ZINCJS_GROUP_EXPORTER_BIN' not in os.environ,
        'define ZINCJS_GROUP_EXPORTER_BIN environment variable to run full '
        'integration test')
    def test_with_success_generation(self):
        registry = zope.component.getUtility(IRegistry)
        utility = zope.component.queryUtility(IZincJSUtility)
        settings = registry.forInterface(
            ISettings, prefix='fieldml.pmr2.settings')
        settings.zincjs_group_exporter = os.environ[
            'ZINCJS_GROUP_EXPORTER_BIN'].decode('utf8')

        fd = gzip_open(join(dirname(__file__), 'input', 'test.ex2.gz'))
        utility(self.testdir, fd.read())
        fd.close()

        scaffolddir = join(self.testdir, 'scaffold')
        self.assertTrue(isdir(scaffolddir))
        self.assertEqual(19, len(listdir(scaffolddir)))
