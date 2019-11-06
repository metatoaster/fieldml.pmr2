import os
from subprocess import Popen, PIPE
from logging import getLogger
from distutils.spawn import find_executable

import zope.component
import zope.interface

from plone.registry.interfaces import IRegistry

from fieldml.pmr2.interfaces import IZincJSUtility
from fieldml.pmr2.interfaces import ISettings

logger = getLogger(__name__)
prefix = 'fieldml.pmr2.settings'


@zope.interface.implementer(IZincJSUtility)
class ZincJSUtility(object):

    def __call__(self, root, model_data):
        registry = zope.component.getUtility(IRegistry)
        try:
            settings = registry.forInterface(ISettings, prefix=prefix)
        except KeyError:
            logger.warning(
                "settings for '%s' not found; the fieldml.pmr2 may need to be "
                "reactivated", prefix,
            )
            return

        executable = find_executable(settings.zincjs_group_exporter)
        if executable is None:
            logger.warning(
                'unable to find the zincjs_group_exporter binary; please '
                "verify the registry key '%s' is set to the valid binary",
                prefix
            )
            return

        # restrict env to just the bare minimum, i.e. don't let things
        # like PYTHONPATH (if set) to interfere with the calling.
        env = {k: os.environ[k] for k in ('PATH',)}
        p = Popen([executable, root], stdin=PIPE, env=env)
        p.communicate(model_data)
