import rdflib

from pmr2.rdf.base import RdfXmlMetadata

namespaces = {
    'dc': 'http://purl.org/dc/elements/1.1/',
    'dcterms': 'http://purl.org/dc/terms/',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'vCard': 'http://www.w3.org/2001/vcard-rdf/3.0#',
    'pmr2': 'http://namespace.physiomeproject.org/pmr2#',
    'pmr2note': 'http://namespace.physiomeproject.org/pmr2/note#',
}


class RdfExposureNoteHelper(RdfXmlMetadata):
    pass
