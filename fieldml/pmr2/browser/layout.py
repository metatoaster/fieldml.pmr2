import os.path
import zope.interface

from plone.z3cform.templates import ZopeTwoFormTemplateFactory
from plone.z3cform.interfaces import IFormWrapper

from pmr2.app.browser.layout import FormWrapper

path = lambda p: os.path.join(os.path.dirname(__file__), p)

class IZincLayoutWrapper(IFormWrapper):
    """
    The interface for the Zinc layout wrapper.
    """


zinc_layout_factory = ZopeTwoFormTemplateFactory(
    path('zinc_layout.pt'), form=IZincLayoutWrapper)


class ZincLayoutWrapper(FormWrapper):
    zope.interface.implements(IZincLayoutWrapper)
